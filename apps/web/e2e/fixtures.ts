import AxeBuilder from '@axe-core/playwright';
import { expect, type Cookie, type Page } from '@playwright/test';

/** Must match apps/api/scripts/e2e-fixtures.ts */
export const E2E_ADMIN = { email: 'e2e-admin@example.com', password: 'e2e-password-not-secret' };
export const FIXTURE_POEM = { slug: 'e2e-first-light', title: 'E2E First Light' };

/** Fails on serious or critical WCAG 2.x A/AA violations. */
export async function expectAccessible(page: Page): Promise<void> {
  // Measure the page at rest: entrance animations briefly blend text with the background.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Next.js development overlay is not part of the site.
    .exclude('nextjs-portal')
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    blocking.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}

/**
 * Signs in once per test run and reuses the session cookie afterwards, so the suite stays
 * within the API's login rate limit (5 per minute), exactly like a real browser would.
 */
let sessionCookies: Cookie[] | null = null;

export async function signIn(page: Page): Promise<void> {
  if (sessionCookies) {
    await page.context().addCookies(sessionCookies);
    await page.goto('/admin');
  } else {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(E2E_ADMIN.email);
    await page.getByLabel('Password').fill(E2E_ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }
  await expect(page.getByRole('heading', { level: 1, name: /, E2E$/ })).toBeVisible();
  sessionCookies ??= await page.context().cookies();
}
