import { expect, test } from '@playwright/test';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('prepares one tool for offline use and reopens it without a network', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();

  const card = page.locator('[data-tool-id="json-formatter"]');
  await card.getByRole('button', { name: /เตรียม JSON Formatter ไว้ใช้ Offline/ }).click();
  await expect(card.locator('[data-action="offline"]')).toHaveText('✓ Offline พร้อม');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /เครื่องมือที่ต้องใช้/ })).toBeVisible();
  await page.goto('./#/tools/json-formatter');
  await expect(page.getByRole('heading', { name: 'JSON Formatter / Validator' })).toBeVisible();
});

test('keeps the initial Hub entry small and lazy-loads the processing worker', async ({ page }) => {
  await page.goto('./');
  const initialResources = await page.evaluate(() => performance.getEntriesByType('resource').map(({ name }) => name));
  expect(initialResources.some((name) => /processing\.worker/i.test(name))).toBe(false);

  await page.goto('./#/tools/image-compressor');
  await expect(page.locator('#compress-status')).toContainText('Canvas');
  await page.locator('#compress-file').setInputFiles({ name: 'worker.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.getByRole('button', { name: 'บีบอัดรูปภาพ' }).click();
  await expect(page.locator('#compress-status')).toContainText('สำเร็จ');
  const processedResources = await page.evaluate(() => performance.getEntriesByType('resource').map(({ name }) => name));
  expect(processedResources.some((name) => /processing\.worker/i.test(name))).toBe(true);
});
