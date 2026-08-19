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

test('draws a Point and Polygon locally, updates stats, and exports GeoJSON', async ({ page }) => {
  await page.goto('./#/tools/community-mapping');
  const leaflet = page.locator('[data-map-host].leaflet-container');
  await expect(leaflet).toBeVisible();
  const leafletBox = await leaflet.boundingBox();
  expect(leafletBox).not.toBeNull();
  const clickAt = async (x: number, y: number) => leaflet.click({ position: { x, y } });
  const pointX = leafletBox!.width * 0.45;
  const pointY = leafletBox!.height * 0.45;
  await page.getByRole('button', { name: 'วางสถานที่' }).first().click();
  await clickAt(pointX, pointY);
  await expect(page.locator('.community-map-stat-grid')).toContainText('1');

  await page.getByRole('button', { name: 'วาดพื้นที่' }).first().click();
  await clickAt(leafletBox!.width * 0.25, leafletBox!.height * 0.25);
  await clickAt(leafletBox!.width * 0.65, leafletBox!.height * 0.25);
  await clickAt(leafletBox!.width * 0.65, leafletBox!.height * 0.65);
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.locator('.community-map-stat-grid')).toContainText('1');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'GeoJSON' }).click();
  expect((await download).suggestedFilename()).toBe('community-map.geojson');
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
