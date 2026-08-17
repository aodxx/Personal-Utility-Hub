import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const base = process.env.PHASE92_BASE || 'https://aodxx.github.io/Personal-Utility-Hub/';
const fixtureDir = path.resolve('tests/fixtures/line-sticker');
const expected = [[230, 40, 40], [40, 100, 230], [20, 170, 100], [240, 150, 20], [150, 60, 210], [20, 160, 210], [220, 70, 140], [80, 170, 60], [230, 100, 30], [50, 130, 190], [170, 80, 190], [50, 170, 120], [210, 60, 60], [70, 100, 200], [230, 120, 40], [70, 160, 160]];
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
    await page.locator('#line-preset-grid').selectOption('4x4');
    await page.locator('#line-file').setInputFiles({ name: 'pixel-signature-4x4-sheet.png', mimeType: 'image/png', buffer: readFileSync(path.join(fixtureDir, 'pixel-signature-4x4-sheet.png')) });
    await page.locator('#line-source-meta').filter({ hasText: '1024×1024' }).waitFor({ state: 'visible', timeout: 15_000 });
    await page.locator('#line-grid-overlay .line-grid-cell-number').nth(15).waitFor({ state: 'visible', timeout: 15_000 });
    record(`${label}: source preview before split`, /1024×1024/.test(await page.locator('#line-source-meta').textContent() || '') && await page.locator('#line-thumbnails .line-thumbnail').count() === 0);
    record(`${label}: overlay 16 cells`, await page.locator('#line-grid-overlay .line-grid-cell-number').count() === 16);
    record(`${label}: downstream disabled before split`, await page.locator('#line-clean-all').isDisabled() && await page.locator('#line-export-zip').isDisabled());
    await page.getByRole('button', { name: 'ตัด 16 ภาพ', exact: true }).click({ force: true });
    await page.locator('#line-thumbnails .line-thumbnail').nth(15).waitFor({ state: 'visible', timeout: 15_000 });
    record(`${label}: explicit split output`, await page.locator('#line-thumbnails .line-thumbnail').count() === 16);
    const actual = await page.locator('#line-thumbnails .line-thumbnail canvas').evaluateAll((elements) => elements.map((element) => { const canvas = element; return Array.from(canvas.getContext('2d').getImageData(48, 48, 1, 1).data.slice(0, 3)); }));
    record(`${label}: pixel identity 16/16`, JSON.stringify(actual) === JSON.stringify(expected));
    record(`${label}: no strip output`, actual.length === 16 && await page.locator('#line-thumbnails .line-thumbnail canvas').evaluateAll((elements) => elements.every((element) => element.width === 96 && element.height === 96)));
    await page.locator('#line-thumbnails .line-thumbnail').nth(6).click();
    const selected = await page.locator('#line-canvas').evaluate((element) => { const canvas = element; return Array.from(canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data.slice(0, 3)); });
    record(`${label}: selected preview identity`, JSON.stringify(selected) === JSON.stringify(expected[6]));
    await page.getByRole('button', { name: 'ลบพื้นหลังทั้งชุด', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'จัดภาพให้อยู่กลางทั้งหมด', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'ใส่ขอบขาวทั้งชุด', exact: true }).click({ force: true });
    await page.getByRole('button', { name: 'Reset current', exact: true }).click({ force: true });
    record(`${label}: processing after split`, await page.locator('#line-status').textContent().then((text) => /Current sticker restored|เสร็จแล้ว/.test(text || '')));
    await page.getByRole('button', { name: 'ดาวน์โหลด ZIP', exact: true }).click({ force: true });
    await page.locator('#line-status').filter({ hasText: 'ZIP ถูกสร้างแล้ว' }).waitFor({ state: 'visible', timeout: 30_000 });
    const zipDownload = downloads.at(-2) || downloads.at(-1);
    const zipPath = zipDownload ? await zipDownload.path() : null;
    let unique = false; let mapping = false; let zipCount = 0;
    if (zipPath && existsSync(zipPath)) {
      const temp = mkdtempSync(path.join(os.tmpdir(), 'phase92-zip-'));
      try { execFileSync('unzip', ['-q', zipPath, '-d', temp]); const names = execFileSync('find', [path.join(temp, 'stickers'), '-maxdepth', '1', '-type', 'f', '-name', '*.png']).toString().trim().split('\n').filter(Boolean).sort(); const hashes = names.map((name) => createHash('sha256').update(readFileSync(name)).digest('hex')); zipCount = names.length; unique = new Set(hashes).size === 16; mapping = names.every((name, index) => name.endsWith(`${String(index + 1).padStart(2, '0')}.png`)); } finally { rmSync(temp, { recursive: true, force: true }); }
    }
    record(`${label}: ZIP 16 unique PNGs`, zipCount === 16 && unique);
    record(`${label}: ZIP source mapping 01..16`, mapping);
    record(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth));
  } catch (error) { record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error)); } finally { await browser.close(); }
}

await checkProfile({ width: 360, height: 740 }, '360x740');
await checkProfile({ width: 412, height: 915 }, '412x915');
await checkProfile({ width: 1280, height: 900 }, '1280x900');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
