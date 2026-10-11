import type { NextConfig } from 'next';
import path from 'node:path';

/**
 * Server-side address of the NestJS API. Browsers never see it: they call /api/* on this site.
 * Note: the /api rewrite below is fixed at build time, so set this when running `next build`
 * as well as at runtime.
 */
const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
);

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: trace dependencies from the repository root so the standalone build is complete.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // The API already stores optimised WebP renditions (full + thumbnail) in object storage,
    // so images are served directly from there. This also keeps the Next.js server from
    // fetching arbitrary remote URLs.
    unoptimized: true,
  },
  async rewrites() {
    // Same-origin API: the admin session cookie stays first-party and SameSite=Strict works.
    return [{ source: '/api/:path*', destination: `${apiInternalUrl}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
