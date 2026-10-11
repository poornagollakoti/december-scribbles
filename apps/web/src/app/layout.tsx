import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist, Instrument_Serif } from 'next/font/google';
import { SITE_URL } from '@/lib/site';
import './globals.css';

// Display grotesk for headlines; serif only for italic accents and literary text; Geist for UI.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'December Scribbles', template: '%s · December Scribbles' },
  description:
    'Poems, quotes and illustrated posters by December Scribbles. Life is nothing without inspirations.',
  applicationName: 'December Scribbles',
  openGraph: { type: 'website', siteName: 'December Scribbles', locale: 'en' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#f5f2ec',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${instrument.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
