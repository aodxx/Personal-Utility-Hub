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
    await page.getByRole('button', { name: 'Layers' }).click();
    record(`${width}x${height} layers/schema`, await page.getByRole('heading', { name: 'Custom Schema Builder' }).isVisible());
    record(`${width}x${height} overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) { record(`${width}x${height} exception`, false, String(error)); }
  await browser.close();
}
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
