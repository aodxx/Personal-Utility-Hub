import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const base = 'https://aodxx.github.io/Personal-Utility-Hub/';
const fixtureDir = path.resolve('tests/fixtures/line-sticker');
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

async function checkProfile(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const downloads = [];
  page.on('download', (download) => downloads.push(download));
  try {
    await page.goto(`${base}#/tools/line-sticker-studio`, { waitUntil: 'networkidle' });
    record(`${label}: route`, await page.locator('h1', { hasText: 'LINE Sticker Studio' }).isVisible());
    await page.locator('#line-file').setInputFiles({ name: 'geometric-sheet.png', mimeType: 'image/png', buffer: readFileSync(path.join(fixtureDir, 'geometric-sheet.png')) });
    await page.locator('#line-thumbnails .line-thumbnail').nth(7).waitFor({ state: 'visible', timeout: 15_000 });
    record(`${label}: split 8 stickers`, await page.locator('#line-thumbnails .line-thumbnail').count() === 8);
    await page.locator('#line-clean').click({ force: true });
    await page.locator('#line-autofit').click({ force: true });
    await page.getByRole('button', { name: 'Generate prompt' }).click({ force: true });
    record(`${label}: prompt generated`, await page.locator('#line-prompt-en').inputValue().then((value) => value.includes('sticker sheet')));
    await page.getByRole('button', { name: 'Export PNG + ZIP + reports' }).click({ force: true });
    await page.locator('#line-status').filter({ hasText: 'ZIP ready' }).waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForTimeout(700);
    const paths = [];
    for (const download of downloads) { const outputPath = await download.path(); if (outputPath) paths.push({ name: download.suggestedFilename(), bytes: readFileSync(outputPath) }); }
    const zip = paths.find((item) => item.name.endsWith('.zip'));
    const txt = paths.find((item) => item.name.endsWith('.txt'));
    record(`${label}: ZIP download`, Boolean(zip && zip.bytes.subarray(0, 4).toString() === 'PK\x03\x04' && zip.bytes.toString().includes('validation-report.json')));
    record(`${label}: TXT validation download`, Boolean(txt && txt.bytes.toString().includes('PASS')));
    await page.selectOption('#line-mode', 'animated');
    await page.locator('#line-file').setInputFiles(Array.from({ length: 5 }, (_, index) => ({ name: `frame-${String(index + 1).padStart(2, '0')}.png`, mimeType: 'image/png', buffer: readFileSync(path.join(fixtureDir, `frame-${String(index + 1).padStart(2, '0')}.png`)) })));
    await page.locator('#line-thumbnails .line-thumbnail').nth(4).waitFor({ state: 'visible', timeout: 15_000 });
    await page.getByRole('button', { name: 'Validate frames' }).click();
    record(`${label}: animated partial workflow`, !(await page.locator('#line-status').textContent()).toLowerCase().includes('apng export ready'));
    record(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) {
    record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await checkProfile({ width: 360, height: 740 }, '360x740');
await checkProfile({ width: 1280, height: 900 }, 'desktop');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
