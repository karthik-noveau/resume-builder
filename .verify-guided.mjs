import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
page.on('pageerror', e => console.log('[pageerror]', e.message))
await page.goto('file:///Users/karthik/work-space/projects/resume-builder/.mockup-preview.html')
await page.waitForTimeout(500)
await page.click('[data-target="screen-guided"]')
await page.waitForTimeout(400)
await page.locator('.frame').first().screenshot({ path: '/tmp/shots/guided-v2-light.png' })

await page.click('#themeToggleBtn')
await page.waitForTimeout(300)
await page.locator('.frame').first().screenshot({ path: '/tmp/shots/guided-v2-dark.png' })
await browser.close()
