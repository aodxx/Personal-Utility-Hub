import { expect, test } from '@playwright/test';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('selects an image area, pixelates it locally, and exposes a downloadable result', async ({ page }) => {
  await page.goto('./#/tools/image-blur');
  await page.locator('#blur-file').setInputFiles({ name: 'private-pixel.png', mimeType: 'image/png', buffer: onePixelPng });
  const image = page.locator('#blur-source-preview');
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect(page.locator('#blur-file-meta')).toContainText('1 × 1 px');
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

  const stage = page.locator('#blur-stage');
  await stage.scrollIntoViewIfNeeded();
  const box = await stage.boundingBox();
  if (!box) throw new Error('Image selection stage has no measurable bounds');
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  await page.mouse.up();
  await expect(page.locator('#blur-selection-meta')).toContainText('กรอบที่เลือก');

  await page.locator('#blur-effect').selectOption('pixelate');
  await page.locator('#blur-strength').fill('24');
  await page.getByRole('button', { name: 'เบลอพื้นที่ที่เลือก / Process selection' }).click();
  await expect(page.locator('#blur-result')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#blur-output-preview')).toHaveAttribute('src', /^blob:/);
  await expect(page.locator('#blur-result-meta')).toContainText('Pixelate 24');
  await expect(page.getByRole('button', { name: 'ดาวน์โหลดรูปภาพ / Download' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
