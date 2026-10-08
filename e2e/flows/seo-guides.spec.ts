import { test, expect } from '@playwright/test'

test('public guides render without JavaScript on mobile', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:5186/guides/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your next move')
  await page.getByRole('link', { name: /How to prepare an ATS-friendly resume/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to prepare an ATS-friendly resume')
  await expect(page.getByRole('heading', { name: 'Check the exported file' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Build my resume' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await context.close()
})

test('metadata stays unique and follows public and private navigation', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/guides/')
  // Interactive navigation proves React has taken over the prerendered document.
  await page.getByRole('link', { name: /How to prepare an ATS-friendly resume/ }).click()
  await expect(page).toHaveURL(/\/guides\/ats-resume\/?$/)
  await expect(page).toHaveTitle(/How to prepare an ATS-friendly resume/)
  await expect(page.locator('title')).toHaveCount(1)
  await expect(page.locator('meta[name="description"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/guides\/ats-resume$/)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  await page.getByRole('link', { name: 'My Resumes', exact: true }).click()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  expect(errors).toEqual([])
})
