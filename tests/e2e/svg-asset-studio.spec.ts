import { expect, test } from '@playwright/test';

const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><path onclick="alert(1)" d="M4 4h16v16H4z"/></svg>';

test.describe('SVG Asset Studio production contract', () => {
  test('searches, inspects, edits, optimizes, exports and builds a pack', async ({ page }) => {
    await page.goto('./#/tools/svg-asset-studio');
    await expect(page.locator('h1', { hasText: 'SVG Asset Studio' })).toBeVisible();
    await expect(page.locator('#svg-grid .svg-asset-card')).toHaveCount(120);
    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('camera');
    await expect(page.locator('#svg-grid .svg-asset-card')).toHaveCount(1);
    await page.locator('[data-action="open"]').click();
    await expect(page.locator('.svg-status-badge')).toHaveText(/PASS|WARNING|FAIL/);
    await expect(page.locator('.svg-metrics')).toContainText('Paths');
    await page.locator('#svg-preview-bg').selectOption('dark');
    await page.locator('#svg-preview-size').selectOption('128');
    await expect(page.locator('#svg-preview svg')).toBeVisible();
    await page.locator('#svg-color-mode').selectOption('currentColor');
    await page.getByRole('button', { name: 'Apply edit' }).click();
    await expect(page.locator('#svg-preview')).toContainText('');
    await page.getByRole('button', { name: 'Fix SVG' }).click();
    await page.getByRole('button', { name: 'Optimize' }).click();
    await expect(page.locator('#svg-status')).toContainText('Optimized');

    const svgDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG' }).click();
    expect((await svgDownload).suggestedFilename()).toMatch(/\.svg$/);
    const pngDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();
    expect((await pngDownload).suggestedFilename()).toMatch(/128px\.png$/);

    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('menu');
    await page.locator('[data-action="pack"]').first().click();
    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('camera');
    await page.locator('[data-action="pack"]').first().click();
    const packDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: /Build icon pack ZIP/ }).click();
    expect((await packDownload).suggestedFilename()).toBe('my-icon-pack.zip');
  });

  test('sanitizes uploaded SVG and keeps the page inside mobile viewport', async ({ page }, testInfo) => {
    await page.goto('./#/tools/svg-asset-studio');
    await page.locator('#svg-upload').setInputFiles({ name: 'malicious.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(maliciousSvg) });
    await expect(page.locator('#svg-status')).toContainText('sanitized locally');
    await expect(page.locator('#svg-preview script')).toHaveCount(0);
    await expect(page.locator('#svg-preview svg')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
    expect(overflow).toBeTruthy();
    if (testInfo.project.name.startsWith('android')) await expect(page.locator('.svg-asset-grid')).toBeVisible();
  });
});
