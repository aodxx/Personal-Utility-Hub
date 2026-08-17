import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('switches the Hub between Thai and English', async ({ page }) => {
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('ภาษา').selectOption('en');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: /Every tool you need/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Images', exact: true })).toBeVisible();
  await expect(page.locator('#tool-grid [data-tool-id="image-compressor"]')).toContainText('Reduce JPEG or WebP');
});

test('orders tools by local usage while preserving full-card navigation', async ({ page }) => {
  await page.goto('./#/tools/pdf-merge');
  await expect(page.getByRole('heading', { name: 'PDF Merge', exact: true })).toBeVisible();
  await page.goto('./#/tools/pdf-merge');
  await page.goto('./');

  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  await page.getByLabel('ลำดับเครื่องมือ').selectOption('frequent');
  await expect(page.locator('#tool-grid .tool-card').first()).toHaveAttribute('data-tool-id', 'pdf-merge');
  await page.locator('#tool-grid [data-tool-id="pdf-merge"]').click({ position: { x: 120, y: 48 } });
  await expect(page).toHaveURL(/#\/tools\/pdf-merge$/);
});

test('reports browser compatibility without a backend', async ({ page }) => {
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Compatibility Check' })).toBeVisible();
  await expect(dialog.locator('#compatibility-list li')).toHaveCount(7);
  await expect(dialog.locator('#compatibility-summary')).toHaveAttribute('data-ready', 'true');
  await expect(dialog).toContainText('ไม่ใช้ Backend');
});

test('exports and imports versioned local settings', async ({ page }) => {
  await page.locator('#tool-grid').getByRole('button', { name: /เพิ่มในรายการโปรด: JSON Formatter/ }).click();
  await page.getByRole('button', { name: 'ตั้งค่า' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ส่งออกการตั้งค่า' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^utility-hub-settings-\d{4}-\d{2}-\d{2}\.json$/);

  const imported = {
    schemaVersion: 1,
    exportedAt: '2026-08-12T00:00:00.000Z',
    preferences: {
      theme: 'dark', locale: 'en', toolOrder: 'frequent', favorites: ['base64'], recent: ['base64'], usage: { base64: 7 },
    },
  };
  await page.locator('#settings-file').setInputFiles({
    name: 'utility-hub-settings.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported)),
  });

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#tool-grid .tool-card').first()).toHaveAttribute('data-tool-id', 'base64');
  await expect(page.locator('#favorites-section')).toContainText('Base64 Encoder / Decoder');
});
