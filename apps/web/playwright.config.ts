import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack browser tests. Starts the API (test database, port 4100) and the website
 * (port 3100, production build). Requires `npm run services:up` and a built API (`npm run build -w @ds/api`).
 * Fixtures are reset in global-setup.ts; never point this at real data.
 */
const WEB_PORT = 3100;
const API_PORT = 4100;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'npm run start:test -w @ds/api',
      cwd: '../..',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      // Production build: realistic caching/revalidation, no dev overlay or on-demand compiling.
      command: `npx next build && npx next start --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        API_INTERNAL_URL: `http://localhost:${API_PORT}`,
        SITE_URL: `http://localhost:${WEB_PORT}`,
        NEXT_PUBLIC_API_BASE_URL: '/api/v1',
      },
    },
  ],
});
