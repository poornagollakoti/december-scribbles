import type { SiteProfile } from '@ds/contracts';
import { SITE_URL } from './site';

/*
 * Structured data (schema.org JSON-LD) shared across pages. It helps search engines understand
 * that December Scribbles is one brand with one website, and how each page fits into it
 * (brand panel, sitelinks, breadcrumbs, Google Images).
 */

export const ORG_ID = `${SITE_URL}/#brand`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The brand as an organisation, linked to its Instagram profile. */
export function brandLd(profile: SiteProfile) {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: profile.displayName,
    url: SITE_URL,
    description: profile.tagline,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/apple-icon.png`,
      width: 180,
      height: 180,
    },
    ...(profile.instagramUrl ? { sameAs: [profile.instagramUrl] } : {}),
  };
}

export function websiteLd(profile: SiteProfile) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: profile.displayName,
    url: SITE_URL,
    description: profile.tagline,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

/** Breadcrumb trail, e.g. Home › Writing › Title. Paths are site-relative. */
export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/** Serialises a JSON-LD graph. "<" is escaped so the output cannot break out of its script tag. */
export function jsonLdHtml(...nodes: object[]): { __html: string } {
  const data = { '@context': 'https://schema.org', '@graph': nodes };
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
