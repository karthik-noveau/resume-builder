import { test, expect } from '@playwright/test'

test('public pages contain useful content and metadata without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  for (const route of ['/', '/templates']) {
    const response = await page.goto(route)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('head title')).toHaveCount(1)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/)
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await expect(page.getByRole('heading', { name: 'Foundation', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/seo/templates-mobile-no-js.png', fullPage: false })
  await context.close()
})

test('metadata stays unique and follows SPA navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  // Wait for React to own the page before exercising client-side navigation.
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Templates', exact: true }).click()
  await expect(page).toHaveTitle('Free Resume Templates — Resume Builder')
  await expect(page.locator('head title')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/templates$/)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
  await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'My Resumes' }).click()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(0)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('private routes and unknown URLs send the correct initial response', async ({ request }) => {
  for (const route of ['/app', '/settings', '/share', '/editor/example/guided']) {
    const response = await request.get(route)
    expect(response.status()).toBe(200)
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow')
    expect(await response.text()).toContain('content="noindex, nofollow"')
    expect(await response.text()).not.toContain('rel="canonical"')
  }
  const missing = await request.get('/this-page-does-not-exist')
  expect(missing.status()).toBe(404)
  expect(await missing.text()).toContain('Page not found')
})
