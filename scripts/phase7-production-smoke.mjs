import { chromium } from 'playwright';

const base = 'https://aodxx.github.io/Personal-Utility-Hub/';
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

async function checkHome(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(`${base}?phase7=af70a90`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#tool-grid .tool-card');
    record(`${label}: home and catalog`, await page.locator('#tool-grid .tool-card').count() === 25);
    record(`${label}: old trust strip removed`, await page.locator('.trust-strip').count() === 0);
    record(`${label}: compact trust chips`, await page.locator('.trust-chip').count() === 3);
    record(`${label}: fallback five cards`, await page.locator('#most-used-carousel .quick-tool-card').count() === 5);
    record(`${label}: fallback order`, await page.locator('#most-used-carousel .quick-tool-card').first().getAttribute('data-tool-id') === 'image-compressor');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
    record(`${label}: no page horizontal overflow`, overflow, `${await page.evaluate(() => document.documentElement.scrollWidth)}px/${await page.evaluate(() => window.innerWidth)}px`);
    const carousel = page.locator('#most-used-carousel');
    const carouselMetrics = await carousel.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
    record(`${label}: native horizontal carousel`, carouselMetrics.scrollWidth >= carouselMetrics.clientWidth);
    await page.locator('.trust-chip').first().focus();
    record(`${label}: trust keyboard explanation`, (await page.locator('#trust-chip-detail').textContent())?.includes('Browser') || (await page.locator('#trust-chip-detail').textContent())?.includes('เบราว์เซอร์'));
    await page.locator('#most-used-carousel .quick-tool-card__tap-target').first().press('Enter');
    await page.waitForURL(/#\/tools\/image-compressor$/);
    record(`${label}: compact card full navigation`, true);
    await page.goBack();
    await page.waitForSelector('#most-used-carousel .quick-tool-card');
    await page.locator('#settings-toggle').click();
    await page.locator('[data-settings-action="clear-usage"]').click();
    record(`${label}: reset returns fallback`, await page.locator('#most-used-carousel .quick-tool-card').first().getAttribute('data-tool-id') === 'image-compressor');
    await page.locator('#settings-toggle').click();
    await page.locator('#settings-locale').selectOption('en');
    await page.waitForSelector('#most-used-title');
    record(`${label}: English Most Used`, (await page.locator('#most-used-title').textContent())?.includes('Your Most Used'));
  } catch (error) {
    record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

async function checkPersonalizationAndRegression() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => localStorage.setItem('utility-hub:usage', JSON.stringify({ base64: 9, 'pdf-merge': 4 })));
    await page.goto(`${base}?phase7=af70a90`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#most-used-carousel .quick-tool-card');
    record('desktop: usage ranking', await page.locator('#most-used-carousel .quick-tool-card').first().getAttribute('data-tool-id') === 'base64');
    await page.reload({ waitUntil: 'networkidle' });
    record('desktop: ranking survives reload', await page.locator('#most-used-carousel .quick-tool-card').first().getAttribute('data-tool-id') === 'base64');
    await page.goto(`${base}?phase7=af70a90#/privacy`, { waitUntil: 'networkidle' });
    record('desktop: privacy route', await page.getByRole('heading', { name: 'ข้อมูลของคุณไปไหน?' }).isVisible());
    await page.goto(`${base}?phase7=af70a90#/tools/json-formatter`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.first-use-hint [data-guidance-action="open"]');
    await page.locator('.first-use-hint [data-guidance-action="open"]').click();
    record('desktop: Phase 6 guide regression', await page.locator('#tool-guide-dialog').isVisible());
    await page.keyboard.press('Escape');
    record('desktop: guide Escape close', !(await page.locator('#tool-guide-dialog').isVisible()));
  } catch (error) {
    record('desktop: regression exception', false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await checkHome({ width: 360, height: 740 }, '360x740');
await checkHome({ width: 412, height: 915 }, 'Pixel-7-class');
await checkHome({ width: 1280, height: 900 }, 'desktop');
await checkPersonalizationAndRegression();

for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
