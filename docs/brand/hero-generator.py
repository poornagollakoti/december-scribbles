"""Hero illustration for December Scribbles: a notebook of handwriting, a poster card with the
closed umbrella (🌂 from the brand's bio), a pencil and December snow. Abstract handwriting only:
no invented words. Usage: python gen_hero.py <out.svg>"""
import math
import random
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
rnd = random.Random(12)  # deterministic

FOREST, FOREST2, CANVAS, INK = "#1e3326", "#2a4433", "#f5f2ec", "#16201a"
BLUSH, ROSE, ROSE_DEEP, LINE, TEAL = "#e9a9b6", "#b0405a", "#8f2f46", "#ddd6cb", "#2f6e73"


def r(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def handwriting(x0, y0, width):
    """Cursive-looking line: words made of prolate-trochoid loops, with word gaps."""
    paths, x = [], x0
    while x < x0 + width - 24:
        letters = rnd.randint(3, 7)
        a, b = 3.1, rnd.uniform(4.2, 5.4)  # b > a gives loops
        pts = []
        steps = letters * 10
        for i in range(steps + 1):
            t = i / 10 * 2 * math.pi
            px = x + a * t - b * math.sin(t)
            if px > x0 + width:
                break
            tall = 1.9 if (i // 10) % 4 == 1 else 1.0  # occasional ascender
            py = y0 - (b * (1 - math.cos(t))) * 0.62 * tall
            pts.append((px, py))
        if len(pts) > 4:
            paths.append("M" + " L".join(f"{r(px)} {r(py)}" for px, py in pts))
        x = pts[-1][0] + rnd.uniform(11, 17) if pts else x + 20
    return paths


parts = []
W, H = 520, 600

# Back card: poster with the closed umbrella.
parts.append('<g transform="rotate(8 360 210)">')
parts.append(f'<rect x="236" y="44" width="246" height="322" rx="20" fill="#0f1b14" opacity=".35" transform="translate(6 12)"/>')
parts.append(f'<rect x="236" y="44" width="246" height="322" rx="20" fill="{BLUSH}"/>')
parts.append(f'<path d="M429 96C415 138 408 186 411 250H447C450 186 443 138 429 96Z" fill="{ROSE_DEEP}"/>')
parts.append(f'<path d="M418 150C423 157 435 157 440 150M414 196C421 204 437 204 444 196" fill="none" stroke="{BLUSH}" stroke-width="3" stroke-linecap="round" opacity=".55"/>')
parts.append(f'<path d="M429 250V290A13 13 0 0 1 403 290" fill="none" stroke="{FOREST}" stroke-width="8" stroke-linecap="round"/>')
parts.append(f'<path d="M429 96V82" stroke="{FOREST}" stroke-width="6" stroke-linecap="round"/>')
parts.append("</g>")

# Front: open notebook page.
parts.append('<g transform="rotate(-5 220 360)">')
parts.append('<rect x="52" y="160" width="312" height="396" rx="22" fill="#0f1b14" opacity=".4" transform="translate(10 16)"/>')
parts.append(f'<rect x="52" y="160" width="312" height="396" rx="22" fill="{CANVAS}"/>')
for i in range(10):
    y = 222 + i * 31
    parts.append(f'<path d="M100 {y}H338" stroke="{LINE}" stroke-width="1.6"/>')
parts.append(f'<path d="M100 184V536" stroke="{BLUSH}" stroke-width="1.8"/>')
for i in range(9):
    cy = 196 + i * 40
    parts.append(f'<circle cx="76" cy="{cy}" r="6.5" fill="{FOREST}"/>')
lines = [(110, 222 - 4, 205), (110, 253 - 4, 222), (110, 284 - 4, 150), (110, 346 - 4, 214), (110, 377 - 4, 190), (110, 408 - 4, 224), (110, 439 - 4, 120)]
for x, y, w in lines:
    for d in handwriting(x, y, w):
        parts.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
# A rose underline scribble under the first line, and a small ink drop.
parts.append(f'<path d="M108 231C160 227 222 228 304 223C264 232 198 237 170 240" fill="none" stroke="{ROSE}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>')
parts.append(f'<circle cx="300" cy="498" r="6" fill="{ROSE}"/>')
parts.append("</g>")

# Pencil resting across the page corner.
parts.append('<g transform="rotate(-38 398 474)">')
parts.append(f'<rect x="300" y="462" width="176" height="24" rx="5" fill="{TEAL}"/>')
parts.append(f'<rect x="300" y="462" width="176" height="8" rx="4" fill="#3d8a8f"/>')
parts.append(f'<rect x="282" y="462" width="22" height="24" rx="4" fill="{BLUSH}"/>')
parts.append(f'<rect x="300" y="462" width="9" height="24" fill="#c3cdc5"/>')
parts.append(f'<path d="M476 462L512 474L476 486Z" fill="#e8d5b5"/>')
parts.append(f'<path d="M500 470L512 474L500 478Z" fill="{INK}"/>')
parts.append("</g>")

# December snow.
for _ in range(60):
    cx, cy = rnd.uniform(10, W - 10), rnd.uniform(10, H - 10)
    if (40 < cx < 380 and 150 < cy < 560) or (220 < cx < 500 and 30 < cy < 400) or (270 < cx < 520 and 380 < cy < 600):
        continue  # keep snow off the cards and the pencil
    if rnd.random() < 0.3:
        s = rnd.uniform(4, 7)
        op = r(rnd.uniform(0.5, 0.9))
        parts.append(
            f'<g stroke="{CANVAS}" stroke-width="1.8" stroke-linecap="round" opacity="{op}">'
            + "".join(
                f'<path d="M{r(cx - s * math.cos(a))} {r(cy - s * math.sin(a))}L{r(cx + s * math.cos(a))} {r(cy + s * math.sin(a))}"/>'
                for a in (0, math.pi / 3, 2 * math.pi / 3)
            )
            + "</g>"
        )
    else:
        parts.append(f'<circle cx="{r(cx)}" cy="{r(cy)}" r="{r(rnd.uniform(1.6, 3.6))}" fill="{CANVAS}" opacity="{r(rnd.uniform(0.35, 0.85))}"/>')

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
    'aria-label="Illustration: an open notebook of handwriting, a poster of a closed umbrella, a pencil and falling snow">'
    + "".join(parts)
    + "</svg>\n"
)
OUT.write_text(svg, encoding="utf-8")
print("hero", len(svg), "bytes")
