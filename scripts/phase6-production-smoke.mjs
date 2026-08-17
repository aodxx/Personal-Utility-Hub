import { chromium } from '@playwright/test';

const base = 'https://aodxx.github.io/Personal-Utility-Hub/';
const routes = [
  ['json-formatter', /JSON text|JSON รวม/i],
  ['qr-reader', /blurry|tilted|เบลอ|เอียง/i],
  ['image-compressor', /lossless|สูญเสีย/i],
  ['pdf-merge', /encrypted|รหัสผ่าน/i],
  ['audio-trimmer', /WAV/i],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, isMobile: true });
const page = await context.newPage();
const results = [];

async function check(label, fn) {
  try {
    await fn();
    results.push({ label, status: 'PASS' });
  } catch (error) {
    results.push({ label, status: 'FAIL', error: String(error.message ?? error) });
  }
}

await check('privacy route', async () => {
  await page.goto(`${base}#/privacy`, { waitUntil: 'networkidle' });
  await page.locator('.privacy-page').waitFor();
  await page.locator('.privacy-page').getByText(/100% safety|100%/i).waitFor();
});

for (const [tool, marker] of routes) {
  await check(`${tool} guide`, async () => {
    await page.goto(`${base}#/tools/${tool}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /How to use|วิธีใช้งาน|อ่านวิธีใช้/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByText(marker).first().waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
  });
}

await check('Audio Trimmer upload-process-preview-export-download', async () => {
  await page.goto(`${base}#/tools/audio-trimmer`, { waitUntil: 'networkidle' });
  await page.locator('#trim-file').setInputFiles('/home/ubuntu/audio-test.wav');
  await page.locator('#trim-editor').waitFor();
  await page.getByRole('button', { name: /ตัดเสียงและสร้าง WAV/i }).click();
  await page.locator('#trim-result').waitFor({ timeout: 15000 });
  await page.locator('#trim-result-meta').getByText(/WAV PCM 16-bit/i).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /ดาวน์โหลด WAV/i }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('-trimmed.wav')) throw new Error(`unexpected download: ${download.suggestedFilename()}`);
});

await check('360px no horizontal overflow', async () => {
  await page.goto(`${base}#/tools/json-formatter`, { waitUntil: 'networkidle' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error(`scrollWidth exceeds viewport: ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
});

await check('JSON Try Sample workflow', async () => {
  await page.goto(`${base}#/tools/json-formatter`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Try sample/i }).click();
  const input = page.locator('#json-input');
  await input.waitFor();
  const value = await input.inputValue();
  if (!value.includes('Utility Hub')) throw new Error(`unexpected sample: ${value}`);
});

await check('hash back-forward-refresh', async () => {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('a[href="#/tools/audio-trimmer"]').first().click();
  await page.waitForURL(/audio-trimmer/);
  await page.goBack();
  await page.waitForTimeout(500);
  if (page.url() !== base && !page.url().endsWith('#/')) throw new Error(`back did not reach home: ${page.url()}`);
  await page.goForward();
  await page.waitForTimeout(500);
  if (!page.url().includes('audio-trimmer')) throw new Error(`forward did not reach tool: ${page.url()}`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Audio Trimmer' }).waitFor();
});

console.log(JSON.stringify({ viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })), results }, null, 2));
await browser.close();
if (results.some(({ status }) => status === 'FAIL')) process.exitCode = 1;
