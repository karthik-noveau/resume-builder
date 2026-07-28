import { chromium, type FullConfig } from '@playwright/test';

/**
 * Vite pre-bundles dependencies lazily on first request and issues a full
 * page reload mid-navigation once it discovers new ones. With fullyParallel
 * workers all hitting a cold dev server at once, that reload races real test
 * navigations and manifests as "click did nothing" flakiness. Warming the
 * routes our specs actually exercise, once, up front avoids that.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const path of ['/', '/app', '/templates?create=true', '/settings']) {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
  }
  await browser.close();
}
