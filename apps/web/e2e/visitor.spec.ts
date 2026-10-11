import { expect, test } from '@playwright/test';
import { expectAccessible, FIXTURE_POEM } from './fixtures';

test.describe('Visitor journeys', () => {
  test('home page presents the brand and leads to the writing @mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('December Scribbles');
    await expect(page.getByRole('link', { name: 'December Scribbles, home' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: /Life is nothing without\s*inspirations/ }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: FIXTURE_POEM.title }).first()).toBeVisible();
    await expectAccessible(page);

    await page.getByRole('link', { name: 'Read the writing' }).first().click();
    await expect(page).toHaveURL(/\/writing$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();
  });

  test('homepage shows each piece once, in one feed per content type', async ({ page }) => {
    await page.goto('/');
    const notebook = page.locator('[aria-roledescription="carousel"]');
    await expect(page.getByRole('heading', { name: 'Latest from the notebook' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New writing' })).toHaveCount(0);

    // Several published pieces → a carousel with working controls.
    // At least the four fixture pieces (the Studio tests may publish more).
    expect(await notebook.getByRole('group').count()).toBeGreaterThanOrEqual(4);
    const next = notebook.getByRole('button', { name: 'Next slides' });
    const prev = notebook.getByRole('button', { name: 'Previous slides' });
    if (await next.isEnabled()) {
      await expect(prev).toBeDisabled();
      await next.click();
      await expect(prev).toBeEnabled();
    }

    // No writing or artwork link appears twice anywhere on the homepage.
    const hrefs = await page
      .locator('main a[href^="/writing/"], main a[href^="/gallery/"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    // Two artworks are too few for a carousel: shown statically, linking to their pages.
    await expect(page.locator('[aria-roledescription="carousel"]')).toHaveCount(1);
    await page.getByRole('link', { name: 'Plain test poster number 1' }).click();
    await expect(page).toHaveURL(/\/gallery\/e2e-poster-1$/);
  });

  test('reads a poem with its line breaks intact', async ({ page }) => {
    await page.goto('/writing');
    await expectAccessible(page);
    await page.getByRole('link', { name: new RegExp(FIXTURE_POEM.title) }).click();
    await expect(page).toHaveURL(`/writing/${FIXTURE_POEM.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FIXTURE_POEM.title);
    const stanza = page.getByText('Fixture line one');
    await expect(stanza).toHaveText('Fixture line one\nFixture line two', { useInnerText: true });
    await expectAccessible(page);
  });

  test('shows a helpful empty state for a type with no writing', async ({ page }) => {
    await page.goto('/writing?kind=PROSE');
    await expect(page.getByRole('heading', { level: 1, name: 'Prose' })).toBeVisible();
    await expect(page.getByText('No prose has been published yet.')).toBeVisible();
  });

  test('missing pages return 404 with a way back', async ({ page }) => {
    const response = await page.goto('/writing/does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'This page wandered off' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to the start/ })).toBeVisible();
  });

  test('opens artwork in an accessible lightbox and returns focus', async ({ page, isMobile }) => {
    await page.goto('/gallery');
    await expectAccessible(page);
    const opener = page.getByRole('link', { name: 'Plain test poster number 1' });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'E2E Poster 1' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/gallery$/);
    await expectAccessible(page);

    if (!isMobile) {
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('dialog', { name: 'E2E Poster 2' })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('artwork has its own page for sharing and search engines', async ({ page }) => {
    await page.goto('/gallery/e2e-poster-1');
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Poster 1' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Plain test poster number 1' })).toBeVisible();
  });

  test('sends an enquiry through the contact form @mobile', async ({ page }) => {
    await page.goto('/contact');
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Please tell us your name')).toBeVisible();

    await page.getByLabel('Your name').fill('Playwright Visitor');
    await page.getByLabel('Email').fill('visitor@example.com');
    await page.getByLabel('What is it about?').selectOption('COLLABORATION');
    await page.getByLabel(/^Message/).fill('Hello! I would love to collaborate on a poetry zine.');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('status')).toContainText('Thank you.');
  });

  test('mobile menu traps focus, navigates and closes @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Close' })).toBeFocused();
    await expectAccessible(page);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    await page.getByRole('button', { name: 'Menu' }).click();
    await menu.getByRole('link', { name: /About/ }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(menu).toBeHidden();
  });
});
