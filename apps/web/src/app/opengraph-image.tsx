import { ImageResponse } from 'next/og';
import { LOGO_ART } from '@/components/logo-art';

export const alt = 'December Scribbles: life is nothing without inspirations.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The official primary logo (dark variant) as an SVG data URI, built from the shared geometry. */
function logoDataUri(): string {
  const a = LOGO_ART.primary;
  const m = LOGO_ART.monogram;
  const [mx, my, ms] = a.mark;
  const [cx, cy, cr] = a.dot;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.viewBox}">` +
    `<g transform="translate(${mx} ${my}) scale(${ms})" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${m.d}" stroke="#f5f2ec" stroke-width="${m.dWidth}"/>` +
    `<path d="${m.s}" stroke="#e9a9b6" stroke-width="${m.sWidth}" transform="${m.sTransform}"/></g>` +
    `<path d="${a.december}" fill="#f5f2ec"/><path d="${a.scribbles}" fill="#f5f2ec"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="#e9a9b6"/>` +
    `<path d="${a.underline}" fill="none" stroke="#e9a9b6" stroke-width="${a.underlineWidth}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Default social sharing card (pages with a cover image override it). */
export default function OpengraphImage() {
  const [, , w, h] = LOGO_ART.primary.viewBox.split(' ').map(Number);
  const logoWidth = 860;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#1e3326',
        backgroundImage:
          'radial-gradient(circle at 85% 15%, rgba(233,169,182,0.25), transparent 45%)',
        color: '#c3cdc5',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img src={logoDataUri()} width={logoWidth} height={(logoWidth * h) / w} alt="" />
      <div style={{ fontSize: 40, marginTop: 48, maxWidth: 900 }}>
        Life is nothing without inspirations. And i write what inspires.
      </div>
    </div>,
    size,
  );
}
