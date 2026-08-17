import { expect, test } from '@playwright/test';

test('opens Community Mapping Privacy Canvas without default tile requests', async ({ page }) => {
  const tiles: string[] = [];
  page.on('request', (request) => { if (request.url().includes('tile.openstreetmap.org')) tiles.push(request.url()); });
  await page.goto('./#/tools/community-mapping');
  await expect(page.getByRole('heading', { name: 'Community Mapping Studio' })).toBeVisible();
  await expect(page.locator('.community-map-privacy strong')).toHaveText('Privacy Canvas');
  await expect(page.locator('[data-map-host]')).toBeVisible();
  await expect(page.locator('.community-map-privacy-tile svg').first()).toBeVisible();
  expect(tiles).toHaveLength(0);
});

test('shows Layers and Custom Schema Builder controls', async ({ page }) => {
  await page.goto('./#/tools/community-mapping');
  await page.getByRole('button', { name: 'Layers' }).click();
  await expect(page.getByRole('heading', { name: 'Layers และ schema' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Custom Schema Builder' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เพิ่ม layer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เพิ่ม field' })).toBeVisible();
});

test('uses map-first fieldwork shell with local filters and commands', async ({ page }) => {
  await page.goto('./#/tools/community-mapping');
  await expect(page.locator('.community-map-sidebar')).toBeVisible();
  await expect(page.locator('.community-map-main')).toBeVisible();
  await expect(page.locator('.community-map-command[data-draw="Point"]')).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'ค้นหา records' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'กรองตาม layer' })).toBeVisible();
  await expect(page.getByRole('button', { name: /นำเข้า JSON/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /บันทึก/ })).toBeVisible();
  await page.getByRole('button', { name: 'Records' }).click();
  await expect(page.getByRole('heading', { name: 'Records จากพื้นที่จริง' })).toBeVisible();
});

test('keeps Community Mapping inside a 360px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android-entry', 'ตรวจเฉพาะ Android profile');
  await page.goto('./#/tools/community-mapping');
  await expect(page.locator('.community-map-tool')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
});
