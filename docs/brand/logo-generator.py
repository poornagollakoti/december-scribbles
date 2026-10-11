"""December Scribbles logo system generator.

Outlines the brand typefaces (OFL: Bricolage Grotesque, Instrument Serif) with HarfBuzz shaping,
adds the hand-drawn DS monogram, the scribble underline and the ink-drop i-dot, and writes:
  - SVG assets (light/dark) into an output dir
  - a TypeScript module with the same geometry for inline React rendering
Usage: python gen.py <svg-out-dir> <ts-out-file>
"""
import json
import re
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).parent
FONTS = HERE / "fonts"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "out"
TS_OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "logo-art.ts"
OUT.mkdir(parents=True, exist_ok=True)

INK = {"light": "#1e3326", "dark": "#f5f2ec"}
ACCENT = {"light": "#b0405a", "dark": "#e9a9b6"}


def r(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def contours(rec):
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur)
            cur = []
    return out


def bbox(contour):
    pts = [pt for _, args in contour for pt in args]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def load(fontfile, variations=None):
    face = hb.Face(hb.Blob.from_file_path(str(fontfile)))
    font = hb.Font(face)
    if variations:
        font.set_variations(variations)
    return face, font


def shape(fontfile, text, size, variations=None, tracking=0.0):
    """Outline `text` at `size` px with baseline at y=0.

    Returns (path d, advance width, i-dot) where i-dot is (cx, cy, radius) of the first "i"
    tittle, which is removed from the outline so it can be redrawn as an accent ink drop."""
    face, font = load(fontfile, variations)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    scale = size / face.upem
    pen = SVGPathPen(None, ntos=r)
    x = 0.0
    dot = None
    for ch, info, pos in zip(text, buf.glyph_infos, buf.glyph_positions):
        rec = RecordingPen()
        font.draw_glyph_with_pen(info.codepoint, rec)
        parts = contours(rec)
        ox = x + pos.x_offset * scale
        if ch == "i" and dot is None and len(parts) > 1:
            top = max(parts, key=lambda c: bbox(c)[1])
            x0, y0, x1, y1 = bbox(top)
            dot = ((x0 + x1) / 2 * scale + ox, -(y0 + y1) / 2 * scale, max(x1 - x0, y1 - y0) / 2 * scale)
            parts = [c for c in parts if c is not top]
        t = TransformPen(pen, (scale, 0, 0, -scale, ox, -pos.y_offset * scale))
        for c in parts:
            for op, args in c:
                getattr(t, op)(*args)
        x += pos.x_advance * scale + tracking * size
    x -= tracking * size
    return pen.getCommands(), x, dot


def cap_height(fontfile, size, variations=None):
    face, font = load(fontfile, variations)
    ext = font.get_glyph_extents(font.get_nominal_glyph(ord("H")))
    return ext.y_bearing * size / face.upem


def translate(d, dx, dy):
    """Translate an absolute-command SVG path (as produced by SVGPathPen)."""
    tokens = re.findall(r"[MLQCZHV]|-?\d*\.?\d+(?:e-?\d+)?", d)
    res, cmd, i = [], None, 0
    while i < len(tokens):
        tkn = tokens[i]
        if tkn.isalpha():
            cmd = tkn
            res.append(cmd)
            i += 1
        elif cmd == "H":
            res.append(r(float(tkn) + dx))
            i += 1
        elif cmd == "V":
            res.append(r(float(tkn) + dy))
            i += 1
        else:
            res.append(r(float(tokens[i]) + dx))
            res.append(r(float(tokens[i + 1]) + dy))
            i += 2
    return re.sub(r" ?([MLQCZHV]) ?", r"\1", " ".join(res))


# ---------------------------------------------------------------------------------------------
# Monogram (64-unit grid): a "D" drawn as a notebook page, with one handwritten "S" stroke
# inside it. The S's tail curls back up like the handle of the closed umbrella from the
# brand's bio (🌂). Round caps so the mark reads as written, not typeset.
# The D occupies x 15–51 and y 12–52 (40 units tall).
# ---------------------------------------------------------------------------------------------
MONO_D = "M15 12V52M15 12H27C41.4 12 51 20.6 51 32C51 43.4 41.4 52 27 52H15"
MONO_S = (
    "M41.6 21.4C38.6 17.8 29.6 17.6 28 23.2C26.2 29.6 42.6 30 41.8 38.8"
    "C41.2 45.2 32.6 47.4 27.6 44.2C24.6 42.3 24.5 38.8 26.9 37.6"
)
MONO_D_W = 6
MONO_S_W = 4.8
# The S sits slightly inside the bowl so it never touches the D (scaled about the bowl centre).
S_K = 0.88
S_T = f"translate({r(34 * (1 - S_K))} {r(32 * (1 - S_K))}) scale({S_K})"


def mono_group(ink, accent, x=0, y=0, s=1.0, dw=MONO_D_W, sw=MONO_S_W):
    return (
        f'<g transform="translate({r(x)} {r(y)}) scale({r(s)})" fill="none" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="{MONO_D}" stroke="{ink}" stroke-width="{dw}"/>'
        f'<path d="{MONO_S}" stroke="{accent}" stroke-width="{r(sw / S_K)}" transform="{S_T}"/>'
        "</g>"
    )


def circle(dot, dx, dy, fill):
    return f'<circle cx="{r(dot[0] + dx)}" cy="{r(dot[1] + dy)}" r="{r(dot[2] * 1.2)}" fill="{fill}"/>'


# ---------------------------------------------------------------------------------------------
# Wordmark
# ---------------------------------------------------------------------------------------------
BRIC = FONTS / "Bricolage.ttf"
SERIF = FONTS / "InstrumentSerif-Italic.ttf"
BRIC_VAR = {"wght": 640, "wdth": 86, "opsz": 96}
PAD = 4


def scribble(x0, y0, w):
    """Hand-drawn underline: one quick pen stroke that doubles back on itself."""
    a, b = x0 + 4, x0 + w - 2
    return (
        f"M{r(a)} {r(y0 + 3)}"
        f"C{r(a + w * 0.28)} {r(y0 - 4)} {r(a + w * 0.62)} {r(y0 - 3)} {r(b)} {r(y0 - 7)}"
        f"C{r(b - w * 0.18)} {r(y0 - 1)} {r(a + w * 0.4)} {r(y0 + 6)} {r(a + w * 0.3)} {r(y0 + 9)}"
    )


# Primary lockup: monogram + one-line wordmark + scribble underline.
CAP = 64
dec_d, dec_w, _ = shape(BRIC, "December", CAP, BRIC_VAR, tracking=-0.035)
scr_d, scr_w, idot = shape(SERIF, "Scribbles", CAP * 1.2, tracking=-0.005)
CAPH = cap_height(BRIC, CAP, BRIC_VAR)
MS = CAPH / 40  # monogram scale: the D is exactly cap height
ASC = CAP * 0.95
DESC = CAP * 0.42
base_y = PAD + ASC
mark_x = PAD - 12 * MS  # D's left stroke edge (x=12 incl. stroke) sits on the padding
mark_y = base_y - 52 * MS  # D bottom on the baseline
word_x = PAD + (54 - 12) * MS + CAP * 0.2
SCR_X = dec_w + CAP * 0.15
underline = scribble(SCR_X + 6, 14, scr_w - 10)
prim_w = word_x + SCR_X + scr_w + PAD
prim_h = ASC + DESC + PAD * 2


def primary(variant):
    ink, acc = INK[variant], ACCENT[variant]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r(prim_w)} {r(prim_h)}" '
        f'role="img" aria-label="December Scribbles"><title>December Scribbles</title>'
        + mono_group(ink, acc, mark_x, mark_y, MS)
        + f'<path fill="{ink}" d="{translate(dec_d, word_x, base_y)}"/>'
        + f'<path fill="{ink}" d="{translate(scr_d, word_x + SCR_X, base_y)}"/>'
        + circle(idot, word_x + SCR_X, base_y, acc)
        + f'<path fill="none" stroke="{acc}" stroke-width="{r(CAP * 0.06)}" stroke-linecap="round" '
        f'stroke-linejoin="round" d="{translate(underline, word_x, base_y)}"/>'
        + "</svg>"
    )


# Compact lockup: monogram + stacked wordmark (narrow headers, mobile).
C_DEC = 40
c_dec_d, c_dec_w, _ = shape(BRIC, "December", C_DEC, BRIC_VAR, tracking=-0.035)
c_scr_d, c_scr_w, c_idot = shape(SERIF, "Scribbles", C_DEC * 1.16, tracking=-0.005)
C_CAPH = cap_height(BRIC, C_DEC, BRIC_VAR)
C_LINE = C_DEC * 0.92
c_base1 = PAD + C_DEC * 0.74
c_base2 = c_base1 + C_LINE
# The D spans from the cap line of "December" to the baseline of "Scribbles".
c_ms = (c_base2 - (c_base1 - C_CAPH)) / 40
c_mark_x = PAD - 12 * c_ms
c_mark_y = c_base2 - 52 * c_ms
c_text_x = PAD + (54 - 12) * c_ms + C_DEC * 0.26
c_w = c_text_x + max(c_dec_w, c_scr_w) + PAD
c_h = c_base2 + C_DEC * 0.3 + PAD


def compact(variant):
    ink, acc = INK[variant], ACCENT[variant]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r(c_w)} {r(c_h)}" '
        f'role="img" aria-label="December Scribbles"><title>December Scribbles</title>'
        + mono_group(ink, acc, c_mark_x, c_mark_y, c_ms)
        + f'<path fill="{ink}" d="{translate(c_dec_d, c_text_x, c_base1)}"/>'
        + f'<path fill="{ink}" d="{translate(c_scr_d, c_text_x, c_base2)}"/>'
        + circle(c_idot, c_text_x, c_base2, acc)
        + "</svg>"
    )


def monogram(variant):
    ink, acc = INK[variant], ACCENT[variant]
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" '
        f'aria-label="December Scribbles"><title>December Scribbles</title>{mono_group(ink, acc)}</svg>'
    )


def app_icon():
    """Favicon / app icon: heavier strokes on a forest tile so it holds up at 16px."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        '<path d="M6 14A8 8 0 0 1 14 6H30C48 6 59 17.6 59 32S48 58 30 58H14A8 8 0 0 1 6 50Z" fill="#1e3326"/>'
        f'<path d="{MONO_S}" fill="none" stroke="{ACCENT["dark"]}" stroke-width="7.4" '
        'stroke-linecap="round" stroke-linejoin="round" transform="translate(-1.6 0) scale(1.04)"/>'
        "</svg>"
    )


files = {
    "logo.svg": primary("light"),
    "logo-dark.svg": primary("dark"),
    "logo-compact.svg": compact("light"),
    "logo-compact-dark.svg": compact("dark"),
    "monogram.svg": monogram("light"),
    "monogram-dark.svg": monogram("dark"),
    "app-icon.svg": app_icon(),
}
for name, svg in files.items():
    (OUT / name).write_text(svg + "\n", encoding="utf-8")


def dot(d, dx, dy):
    return [round(d[0] + dx, 2), round(d[1] + dy, 2), round(d[2] * 1.2, 2)]


art = {
    "monogram": {"d": MONO_D, "s": MONO_S, "dWidth": MONO_D_W, "sWidth": round(MONO_S_W / S_K, 2), "sTransform": S_T},
    "primary": {
        "viewBox": f"0 0 {r(prim_w)} {r(prim_h)}",
        "mark": [round(mark_x, 2), round(mark_y, 2), round(MS, 4)],
        "december": translate(dec_d, word_x, base_y),
        "scribbles": translate(scr_d, word_x + SCR_X, base_y),
        "dot": dot(idot, word_x + SCR_X, base_y),
        "underline": translate(underline, word_x, base_y),
        "underlineWidth": round(CAP * 0.06, 2),
    },
    "compact": {
        "viewBox": f"0 0 {r(c_w)} {r(c_h)}",
        "mark": [round(c_mark_x, 2), round(c_mark_y, 2), round(c_ms, 4)],
        "december": translate(c_dec_d, c_text_x, c_base1),
        "scribbles": translate(c_scr_d, c_text_x, c_base2),
        "dot": dot(c_idot, c_text_x, c_base2),
    },
}
TS_OUT.write_text(
    "/*\n"
    " * Generated logo geometry: outlined Bricolage Grotesque + Instrument Serif Italic (both SIL OFL)\n"
    " * plus the hand-drawn DS monogram. The SVG files in public/brand come from the same generator\n"
    " * (docs/brand/logo-generator.py); regenerate rather than editing by hand.\n"
    " */\n"
    f"export const LOGO_ART = {json.dumps(art, indent=2)} as const;\n",
    encoding="utf-8",
)
print(f"primary {r(prim_w)}x{r(prim_h)}  compact {r(c_w)}x{r(c_h)}")
