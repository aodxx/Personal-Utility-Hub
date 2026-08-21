import { test, expect } from '@playwright/test';

test.describe('Land Measurement production contract', () => {
  test('renders map-first distance and area workflow with local exports', async ({ page }) => {
    await page.goto('./#/tools/land-measurement');
    await expect(page.locator('#land-title')).toContainText('วัดระยะและพื้นที่แปลง');
    await expect(page.locator('#land-map')).toBeVisible();
    await expect(page.locator('.land-map-actions')).toBeVisible();
    await expect(page.locator('.land-map-actions [data-action="undo"]')).toHaveText('ย้อนจุดล่าสุด');
    await page.locator('#land-map').click({ position: { x: 90, y: 90 } });
    await page.locator('#land-map').click({ position: { x: 260, y: 90 } });
    await expect(page.locator('#land-summary')).toContainText(/ระยะรวม|Total distance/);
    await expect(page.locator('.land-quality')).toContainText(/ยังประเมินไม่ได้|Not enough quality data/);
    await page.getByRole('button', { name: 'จัดแผนที่ให้เห็นจุด' }).click();
    await expect(page.locator('#land-status')).toContainText(/จัดแผนที่|fitted/);
    await expect(page.locator('.land-segments li')).toHaveCount(1);
    await page.getByRole('button', { name: 'วัดพื้นที่' }).click();
    await page.locator('#land-map').click({ position: { x: 260, y: 250 } });
    await page.locator('#land-map').click({ position: { x: 90, y: 250 } });
    await expect(page.locator('#land-summary')).toContainText(/พื้นที่|Area/);
    await expect(page.locator('.land-points')).toContainText('4');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV', exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/land-measurement-csv\.csv$/);
    await page.getByRole('button', { name: 'ล้างทั้งหมด' }).click();
    await expect(page.locator('#land-points')).toContainText('ยังไม่มีจุด');
  });

  test('keeps the measurement workspace usable at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('./#/tools/land-measurement');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('.land-disclaimer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'เดินวัด GPS' })).toBeVisible();
  });
});
