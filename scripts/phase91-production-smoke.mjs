import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const base = process.env.PHASE91_BASE || 'https://aodxx.github.io/Personal-Utility-Hub/';
const fixtureDir = path.resolve('tests/fixtures/line-sticker');
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

async function checkProfile(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const requests = [];
  const downloads = [];
  page.on('request', (request) => { if (request.url().includes('PRIVATE_STICKER_PROMPT_12345') || request.postData()?.includes('PRIVATE_STICKER_PROMPT_12345')) requests.push(request.url()); });
  page.on('download', (download) => downloads.push(download));
  try {
    await page.goto(`${base}#/tools/line-sticker-studio`, { waitUntil: 'networkidle' });
    record(`${label}: route`, await page.locator('h1', { hasText: 'LINE Sticker Studio' }).isVisible());
    record(`${label}: six steps`, await page.locator('[data-line-step]').count() >= 6);
    await page.locator('#line-prompt-character').fill('PRIVATE_STICKER_PROMPT_12345');
    await page.locator('#line-prompt-phrases').fill('สวัสดี, ขอบคุณ');
    await page.getByRole('button', { name: 'สร้าง Prompt', exact: true }).click();
    record(`${label}: prompt guards`, (await page.locator('#line-prompt-en').inputValue()).includes('no poster'));
    await page.getByRole('button', { name: 'คัดลอก Prompt', exact: true }).click();
    record(`${label}: no prompt network`, requests.length === 0);
    await page.locator('#line-preset-grid').selectOption('4x4');
    await page.locator('#line-file').setInputFiles({ name: 'geometric-sheet.png', mimeType: 'image/png', buffer: readFileSync(path.join(fixtureDir, 'geometric-sheet.png')) });
    await page.locator('#line-thumbnails .line-thumbnail').nth(15).waitFor({ state: 'visible', timeout: 15_000 });
    record(`${label}: suggested 4x4`, (await page.locator('#line-split-summary').textContent()).includes('4×4'));
    record(`${label}: numbered preview`, await page.locator('#line-grid-overlay .line-grid-cell-number').count() === 16);
    record(`${label}: quick split output`, await page.locator('#line-thumbnails .line-thumbnail').count() === 16);
    await page.getByRole('button', { name: 'ใส่ขอบขาวทั้งชุด' }).click();
    await page.getByRole('button', { name: 'ตรวจและแก้' }).click().catch(() => page.getByRole('button', { name: '5 ตรวจและแก้' }).click());
    await page.getByRole('button', { name: 'Refresh validation' }).click();
    record(`${label}: review summary`, await page.locator('#line-review-report').textContent().then((value) => /PASS|WARNING|FAIL/.test(value || '')));
    await page.getByRole('button', { name: 'ดาวน์โหลด ZIP' }).click();
    await page.locator('#line-status').filter({ hasText: 'ZIP ถูกสร้างแล้ว' }).waitFor({ state: 'visible', timeout: 30_000 });
    const paths = [];
    for (const download of downloads) { const outputPath = await download.path(); if (outputPath) paths.push({ name: download.suggestedFilename(), bytes: readFileSync(outputPath) }); }
    const zip = paths.find((item) => item.name.endsWith('.zip'));
    record(`${label}: ZIP integrity`, Boolean(zip && zip.bytes.subarray(0, 4).toString() === 'PK\x03\x04' && zip.bytes.toString().includes('stickers/16')));
    record(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) {
    record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await checkProfile({ width: 360, height: 740 }, '360x740');
await checkProfile({ width: 412, height: 915 }, '412x915');
await checkProfile({ width: 1280, height: 900 }, 'desktop');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
