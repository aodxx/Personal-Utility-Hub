import { chromium } from '@playwright/test';

const base = process.env.COMMUNITY_MAP_SMOKE_BASE || 'https://aodxx.github.io/Personal-Utility-Hub/';
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

for (const [width, height] of [[360, 740], [412, 915], [1280, 900]]) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });
  const tiles = [];
  page.on('request', (request) => { if (request.url().includes('tile.openstreetmap.org')) tiles.push(request.url()); });
  try {
    await page.goto(`${base}#/tools/community-mapping`, { waitUntil: 'networkidle' });
    record(`${width}x${height} route`, await page.getByRole('heading', { name: 'Community Mapping Studio' }).isVisible());
    record(`${width}x${height} privacy`, await page.getByText('Privacy Canvas', { exact: true }).isVisible() && tiles.length === 0, `${tiles.length} tile requests`);
    record(`${width}x${height} map-first shell`, await page.locator('.community-map-sidebar').isVisible() && await page.locator('.community-map-main').isVisible() && await page.locator('[data-map-host]').isVisible());
    record(`${width}x${height} fieldwork commands`, await page.locator('.community-map-command[data-draw="Point"]').isVisible() && await page.locator('.community-map-command[data-draw="Polygon"]').isVisible() && await page.locator('.community-map-command[data-draw="LineString"]').isVisible());
    record(`${width}x${height} search filters`, await page.getByRole('searchbox', { name: 'ค้นหา records' }).isVisible() && await page.getByRole('combobox', { name: 'กรองตาม layer' }).isVisible() && await page.getByRole('combobox', { name: 'กรองตาม geometry' }).isVisible());
    record(`${width}x${height} local save/import`, await page.getByRole('button', { name: /นำเข้า JSON/ }).isVisible() && await page.getByRole('button', { name: /บันทึก/ }).isVisible());
    await page.getByRole('button', { name: 'Layers' }).click();
    record(`${width}x${height} layers/schema`, await page.getByRole('heading', { name: 'Custom Schema Builder' }).isVisible());
    record(`${width}x${height} mobile action rail`, width > 600 || await page.locator('.community-map-mobile-actions').isVisible());
    record(`${width}x${height} overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) { record(`${width}x${height} exception`, false, String(error)); }
  await browser.close();
}
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
