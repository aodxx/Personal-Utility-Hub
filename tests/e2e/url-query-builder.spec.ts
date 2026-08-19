import { expect, test } from '@playwright/test';

test.describe('URL Query String Builder production contract', () => {
  test('parses and rebuilds Unicode query parameters with repeated keys and hash', async ({ page }) => {
    await page.goto('./#/tools/url-query-builder');
    await expect(page.getByRole('heading', { name: 'URL Query Builder' })).toBeVisible();
    await page.locator('#url-query-url').fill('https://example.com/search?q=ชุมชน&tag=a&tag=b#results');
    await page.getByRole('button', { name: /แยก URL/ }).click();
    await expect(page.locator('#url-query-base')).toHaveValue('https://example.com/search');
    await expect(page.locator('#url-query-params')).toHaveValue('q=ชุมชน\ntag=a\ntag=b');
    await expect(page.locator('#url-query-hash')).toHaveValue('results');
    await page.getByRole('button', { name: /ประกอบ URL/ }).click();
    await expect(page.locator('#url-query-result')).toHaveValue('https://example.com/search?q=%E0%B8%8A%E0%B8%B8%E0%B8%A1%E0%B8%8A%E0%B8%99&tag=a&tag=b#results');
    await expect(page.locator('#url-query-status')).toContainText('สำเร็จ');
  });

  test('keeps the text/data workflow within a 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('./#/tools/url-query-builder');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await expect(page.locator('#url-query-url')).toHaveValue(/example\.com/);
  });
});
