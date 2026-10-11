import { expect, test } from '@playwright/test';
import { E2E_ADMIN, expectAccessible, signIn } from './fixtures';

test.describe('Studio (administrator) journeys', () => {
  test('signed-out visitors are sent to the login page', async ({ page }) => {
    await page.goto('/admin/writing');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fwriting$/);
    await expectAccessible(page);
  });

  test('wrong credentials show an error', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(E2E_ADMIN.email);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password' }),
    ).toBeVisible();
  });

  test('overview shows real counts and recent content', async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('link', { name: /Published writing\s*4/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recently updated' })).toBeVisible();
    await expect(page.getByRole('link', { name: /E2E First Light/ }).first()).toBeVisible();
    await expectAccessible(page);
  });

  test('publishes new writing that appears on the public site immediately', async ({ page }) => {
    await signIn(page);
    await page
      .getByRole('navigation', { name: 'Studio' })
      .getByRole('link', { name: 'Writing' })
      .click();
    await expectAccessible(page);
    await page.getByRole('link', { name: 'New writing' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'New writing' })).toBeVisible();

    await page.getByLabel('Title', { exact: true }).fill('Playwright Snowfall');
    await page
      .getByLabel('Text', { exact: true })
      .fill('Quiet snow\non quiet streets\n\nand then morning');
    await page.getByLabel('Type').selectOption('POEM');
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Published' })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/writing\/[0-9a-f-]{36}$/);
    await expect(page.getByLabel('URL slug (optional)')).toHaveValue('playwright-snowfall');

    // Public pages are cached; publishing must invalidate them.
    await page.goto('/writing');
    await expect(page.getByRole('link', { name: /Playwright Snowfall/ })).toBeVisible();
    await page.goto('/writing/playwright-snowfall');
    await expect(page.getByText('Quiet snow')).toBeVisible();
  });

  test('unpublishes and republishes from the writing list', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/writing?search=E2E%20Note%203');
    await page.getByRole('button', { name: 'Unpublish E2E Note 3' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'was unpublished' })).toBeVisible();
    const response = await page.request.get('/writing/e2e-note-3');
    expect(response.status()).toBe(404);

    await page.getByRole('button', { name: 'Publish E2E Note 3' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'is now live' })).toBeVisible();
    expect((await page.request.get('/writing/e2e-note-3')).status()).toBe(200);
  });

  test('deleting asks for confirmation and can be cancelled', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/writing?search=Playwright%20Snowfall');
    await page.getByRole('button', { name: 'Delete Playwright Snowfall' }).click();
    const dialog = page.getByRole('dialog', { name: /Delete “Playwright Snowfall”/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('link', { name: 'Playwright Snowfall', exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Delete Playwright Snowfall' }).click();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'was deleted' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Playwright Snowfall', exact: true })).toBeHidden();
  });

  test('hides artwork with its publish switch, removing it from the public gallery', async ({
    page,
  }) => {
    await signIn(page);
    await page
      .getByRole('navigation', { name: 'Studio' })
      .getByRole('link', { name: 'Posters & Illustrations' })
      .click();
    await expectAccessible(page);
    const toggle = page.getByRole('switch', { name: 'Show “E2E Poster 2” on the site' });
    await expect(toggle).toBeChecked();
    await toggle.click({ force: true });
    await expect(page.getByRole('status').filter({ hasText: 'is hidden' })).toBeVisible();
    expect((await page.request.get('/gallery/e2e-poster-2')).status()).toBe(404);

    await toggle.click({ force: true });
    await expect(page.getByRole('status').filter({ hasText: 'is now on the site' })).toBeVisible();
    expect((await page.request.get('/gallery/e2e-poster-2')).status()).toBe(200);
  });

  test('reads a visitor enquiry and marks it read', async ({ page, request }) => {
    const sent = await request.post('/api/v1/enquiries', {
      data: {
        name: 'Admin Spec Visitor',
        email: 'a@example.com',
        type: 'FEEDBACK',
        message: 'Your poems brighten my mornings.',
      },
    });
    expect(sent.status()).toBe(201);
    await signIn(page);
    await page.goto('/admin/enquiries?status=NEW');
    const card = page.getByRole('listitem').filter({ hasText: 'Admin Spec Visitor' });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Mark read' }).click();
    await expect(card).toBeHidden();
  });

  test('signs out from the account menu', async ({ page }) => {
    await signIn(page);
    await page.getByRole('button', { name: /Account: E2E Admin/ }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
