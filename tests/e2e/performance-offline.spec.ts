import { expect, test } from '@playwright/test';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('prepares one tool for offline use and reopens it without a network', async ({ page, context }) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`));

  await page.goto('./');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const card = page.locator('[data-tool-id="json-formatter"]');
  const offlineButton = card.locator('[data-action="offline"]');
  await expect(offlineButton).toHaveAccessibleName('เตรียม JSON Formatter / Validator ไว้ใช้ Offline');
  await offlineButton.click();
  await expect(offlineButton).toHaveText('✓ Offline พร้อม');

  const cachedPaths = await page.evaluate(async () => (
    (await Promise.all((await caches.keys()).map(async (name) => (
      (await caches.open(name)).keys()
    )))).flat().map(({ url }) => new URL(url).pathname)
  ));
  expect(cachedPaths).toContain('/Personal-Utility-Hub/index.html');
  expect(cachedPaths.some((path) => /\/assets\/index-.+\.js$/.test(path))).toBe(true);
  expect(cachedPaths.some((path) => /\/assets\/index-.+\.css$/.test(path))).toBe(true);
  expect(cachedPaths.some((path) => /\/assets\/json-formatter-.+\.js$/.test(path))).toBe(true);

  await context.setOffline(true);
  await page.reload();
  const homeHeading = page.getByRole('heading', { name: /เครื่องมือที่ต้องใช้/ });
  if (!await homeHeading.isVisible()) {
    throw new Error(JSON.stringify({
      url: page.url(),
      title: await page.title(),
      body: (await page.locator('body').innerText()).slice(0, 500),
      controller: await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      pageErrors,
      failedRequests,
    }, null, 2));
  }
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
