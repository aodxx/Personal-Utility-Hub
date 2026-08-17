import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const base = process.env.SVG_SMOKE_BASE || 'https://aodxx.github.io/Personal-Utility-Hub/';
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });
const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><path onclick="alert(1)" d="M4 4h16v16H4z"/></svg>';

async function checkProfile(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  try {
    await page.goto(`${base}#/tools/svg-asset-studio`, { waitUntil: 'networkidle' });
    record(`${label}: route`, await page.locator('h1', { hasText: 'SVG Asset Studio' }).isVisible());
    await page.locator('#svg-grid .svg-asset-card').nth(119).waitFor({ state: 'visible', timeout: 15_000 });
    record(`${label}: curated library`, await page.locator('#svg-grid .svg-asset-card').count() === 120);

    const semanticFingerprints = [];
    for (const [query, title] of [['camera', 'Camera'], ['bell', 'Bell'], ['archive', 'Archive']]) {
      await page.getByRole('searchbox', { name: 'Search SVG' }).fill(query);
      const cards = page.locator('#svg-grid .svg-asset-card');
      record(`${label}: search ${query}`, await cards.count() === 1 && await cards.first().textContent().then((text) => text.includes(title)));
      await cards.first().locator('[data-action="open"]').click();
      await page.locator('#svg-preview svg').waitFor({ state: 'visible' });
      await page.waitForFunction((expected) => document.querySelector('#svg-preview svg title')?.textContent?.trim() === expected, title);
      record(`${label}: preview ${query}`, await page.locator('#svg-preview svg title').textContent().then((text) => text.trim() === title));
      semanticFingerprints.push(await page.locator('#svg-preview svg').evaluate((element) => element.innerHTML.replace(/<title[\s\S]*?<\/title>/i, '').replace(/\s+/g, ' ').trim()));
    }
    record(`${label}: semantic geometry distinct`, new Set(semanticFingerprints).size === 3);

    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('camera');
    await page.locator('[data-action="open"]').click();
    await page.locator('#svg-preview-bg').selectOption('light');
    await page.locator('#svg-preview-size').selectOption('16');
    record(`${label}: light 16px preview`, await page.locator('#svg-preview svg').isVisible());
    await page.locator('#svg-preview-bg').selectOption('dark');
    await page.locator('#svg-preview-size').selectOption('24');
    record(`${label}: dark 24px preview`, await page.locator('#svg-preview svg').isVisible());
    record(`${label}: inspector`, await page.locator('.svg-status-badge').isVisible() && await page.locator('.svg-metrics').textContent().then((text) => text.includes('Paths')));
    await page.getByRole('button', { name: 'Fix SVG' }).click();

    const svgDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG' }).click();
    const svgPath = await (await svgDownload).path();
    const svgBytes = svgPath ? readFileSync(svgPath) : Buffer.alloc(0);
    const svgText = svgBytes.toString('utf8');
    record(`${label}: SVG download`, svgText.includes('<svg') && /<title[^>]*>Camera<\/title>/i.test(svgText) && !/script|javascript:|onload=/i.test(svgText));
    const pngDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export PNG' }).click();
    record(`${label}: PNG download`, (await pngDownload).suggestedFilename().endsWith('.png'));
    await page.getByRole('button', { name: 'Optimize' }).click();
    record(`${label}: optimizer`, (await page.locator('#svg-status').textContent()).includes('Optimized'));

    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('menu');
    await page.locator('[data-action="pack"]').first().click();
    await page.getByRole('searchbox', { name: 'Search SVG' }).fill('camera');
    await page.locator('[data-action="pack"]').first().click();
    const packDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: /Build icon pack ZIP/ }).click();
    const packPath = await (await packDownload).path();
    const packBytes = packPath ? readFileSync(packPath) : Buffer.alloc(0);
    record(`${label}: icon pack`, packBytes.subarray(0, 4).toString('binary') === 'PK\x03\x04' && packBytes.includes('LICENSES.txt') && packBytes.includes('sprite.svg') && packBytes.includes('icons.css'));

    await page.locator('#svg-upload').setInputFiles({ name: 'malicious.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(maliciousSvg) });
    await page.locator('#svg-status').filter({ hasText: 'sanitized locally' }).waitFor({ state: 'visible', timeout: 10_000 });
    record(`${label}: upload sanitizer`, await page.locator('#svg-preview script').count() === 0 && await page.locator('#svg-preview [onload]').count() === 0);
    record(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) {
    record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await checkProfile({ width: 360, height: 740 }, '360x740');
await checkProfile({ width: 412, height: 915 }, '412x915');
await checkProfile({ width: 1280, height: 900 }, '1280x900');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
