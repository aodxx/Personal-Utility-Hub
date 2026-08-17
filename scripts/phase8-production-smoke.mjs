import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const base = 'https://aodxx.github.io/Personal-Utility-Hub/';
const fixtureDir = path.resolve('tests/fixtures/audio');
const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

const inputs = [
  ['mono-44k.wav', 'audio/wav'],
  ['speech.mp3', 'audio/mpeg'],
  ['voice.m4a', 'audio/mp4'],
  ['speech.ogg', 'audio/ogg'],
  ['voice.webm', 'audio/webm'],
];

async function waitForAudioDecode(page, selector, label) {
  await page.locator(selector).setInputFiles({ name: path.basename(label), mimeType: 'audio/wav', buffer: readFileSync(label) });
}

async function checkProfile(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(`${base}?phase8=decoder-recovery`, { waitUntil: 'networkidle' });
    await page.goto(`${base}?phase8=decoder-recovery#/tools/audio-trimmer`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#trim-file');
    record(`${label}: Audio Trimmer route`, await page.getByRole('heading', { name: 'Audio Trimmer' }).isVisible());

    for (const [name, mimeType] of inputs) {
      const filePath = path.join(fixtureDir, name);
      await page.locator('#trim-file').setInputFiles({ name, mimeType, buffer: readFileSync(filePath) });
      const decoded = await page.locator('#trim-editor').isVisible().catch(() => false);
      record(`${label}: decode ${name}`, decoded, decoded ? '' : await page.locator('#trim-status').textContent() || 'editor not visible');
      if (!decoded) continue;
      await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
      await page.waitForSelector('#trim-result:not([hidden])', { timeout: 15_000 });
      const meta = await page.locator('#trim-result-meta').textContent();
      record(`${label}: process ${name} to WAV`, Boolean(meta?.includes('WAV PCM 16-bit') && meta.includes('ch') && meta.includes('Hz')));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'ดาวน์โหลด WAV' }).click();
      const download = await downloadPromise;
      const outputPath = await download.path();
      const bytes = outputPath ? readFileSync(outputPath) : Buffer.alloc(0);
      record(`${label}: download ${name}`, bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WAVE');
    }

    await page.goto(`${base}?phase8=decoder-recovery#/tools/audio-compressor`, { waitUntil: 'networkidle' });
    record(`${label}: Audio Resampler naming`, await page.getByRole('heading', { name: 'Audio Resampler (WAV)' }).isVisible());
    record(`${label}: Audio category renamed`, (await page.locator('body').textContent()).includes('เสียง') && !(await page.locator('body').textContent()).includes('เสียงและวิดีโอ'));

    await page.goto(`${base}?phase8=decoder-recovery#/tools/audio-chapter-marker`, { waitUntil: 'networkidle' });
    await page.locator('#chapter-file').setInputFiles({ name: 'chapter-tone.wav', mimeType: 'audio/wav', buffer: readFileSync(path.join(fixtureDir, 'mono-44k.wav')) });
    await page.getByText('Audio ready').waitFor({ timeout: 15_000 });
    await page.getByRole('button', { name: /เพิ่ม marker/ }).click();
    record(`${label}: Chapter Marker ready`, await page.locator('#chapter-list li').count() === 1);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
    record(`${label}: no horizontal overflow`, overflow);
  } catch (error) {
    record(`${label}: smoke exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await checkProfile({ width: 360, height: 740 }, '360x740');
await checkProfile({ width: 412, height: 915 }, 'Pixel-7-class');
await checkProfile({ width: 1280, height: 900 }, 'desktop');

for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} | ${result.name}${result.detail ? ` | ${result.detail}` : ''}`);
const passed = results.filter((result) => result.pass).length;
console.log(`SUMMARY | ${passed}/${results.length} passed`);
if (passed !== results.length) process.exitCode = 1;
