import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function pdfBuffer(pages: number, title: string): Promise<Buffer> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([320, 480]);
  document.setTitle(title);
  return Buffer.from(await document.save());
}

function wavBuffer(durationSeconds = 1): Buffer {
  const sampleRate = 8_000;
  const frames = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(44 + frames * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + frames * 2, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index += 1) buffer.writeInt16LE(Math.round(Math.sin(index / 8) * 8_000), 44 + index * 2);
  return buffer;
}

test('trims an audio clip locally with preview and WAV output', async ({ page }) => {
  await page.goto('./#/tools/audio-trimmer');
  await page.locator('#trim-file').setInputFiles({ name: 'voice.wav', mimeType: 'audio/wav', buffer: wavBuffer() });
  await expect(page.locator('#trim-editor')).toBeVisible();
  await expect(page.locator('#trim-waveform')).toBeVisible();
  await page.locator('#trim-fade-in').fill('0.1');
  await page.locator('#trim-fade-out').fill('0.1');
  await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
  await expect(page.locator('#trim-result')).toBeVisible();
  await expect(page.locator('#trim-result-meta')).toContainText('WAV PCM 16-bit');
  await expect(page.locator('#trim-status')).toContainText('สำเร็จ');
});

test('runs all five new audio workbenches with real output', async ({ page }) => {
  test.setTimeout(120_000);
  const cases = [
    { route: 'audio-compressor', input: [{ name: 'compress.wav', mimeType: 'audio/wav', buffer: wavBuffer() }], setup: async () => { await page.locator('#audio-target').fill('0.05'); } },
    { route: 'audio-merger', input: [{ name: 'one.wav', mimeType: 'audio/wav', buffer: wavBuffer() }, { name: 'two.wav', mimeType: 'audio/wav', buffer: wavBuffer() }], setup: async () => { await expect(page.locator('#audio-file-list li')).toHaveCount(2); await page.locator('[data-audio-move="up"]').last().click(); await page.locator('#audio-gap').fill('0.1'); await page.locator('#audio-crossfade').fill('0.05'); } },
    { route: 'silence-remover', input: [{ name: 'silence.wav', mimeType: 'audio/wav', buffer: wavBuffer() }], setup: async () => { await page.locator('#audio-threshold').fill('-35'); await page.locator('#audio-padding').fill('0.05'); } },
    { route: 'audio-finisher', input: [{ name: 'finish.wav', mimeType: 'audio/wav', buffer: wavBuffer() }], setup: async () => { await page.locator('#audio-gain').fill('2'); await page.locator('#audio-fade-out').fill('0.1'); } },
    { route: 'audio-speed-pitch', input: [{ name: 'speed.wav', mimeType: 'audio/wav', buffer: wavBuffer() }], setup: async () => { await page.locator('#audio-speed').fill('1.25'); await page.locator('#audio-semitones').fill('2'); } },
  ];
  for (const item of cases) {
    await page.goto(`./#/tools/${item.route}`);
    await page.locator('#audio-file').setInputFiles(item.input);
    await expect(page.locator('#audio-editor')).toBeVisible();
    await item.setup();
    await page.locator('#audio-form').dispatchEvent('submit');
    await expect(page.locator('#audio-status')).toContainText('Processing complete', { timeout: 15_000 });
    await expect(page.locator('#audio-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#audio-result-meta')).toContainText('Peak');
  }
});

test('compresses an image and combines images into PDF locally', async ({ page }) => {
  await page.goto('./#/tools/image-compressor');
  await page.locator('#compress-file').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.getByRole('button', { name: 'บีบอัดรูปภาพ' }).click();
  await expect(page.locator('#compress-result')).toBeVisible();
  await expect(page.locator('#compress-status')).toContainText('สำเร็จ');

  await page.goto('./#/tools/images-to-pdf');
  await page.locator('#images-pdf-files').setInputFiles([
    { name: 'first.png', mimeType: 'image/png', buffer: onePixelPng },
    { name: 'second.png', mimeType: 'image/png', buffer: onePixelPng },
  ]);
  await page.getByRole('button', { name: 'สร้าง PDF' }).click();
  await expect(page.locator('#images-pdf-result')).toBeVisible();
  await expect(page.locator('#images-pdf-result-meta')).toContainText('2 หน้า');
});

test('merges and splits PDF pages without uploading documents', async ({ page }) => {
  const first = await pdfBuffer(2, 'First');
  const second = await pdfBuffer(1, 'Second');
  await page.goto('./#/tools/pdf-merge');
  await page.locator('#merge-files').setInputFiles([
    { name: 'first.pdf', mimeType: 'application/pdf', buffer: first },
    { name: 'second.pdf', mimeType: 'application/pdf', buffer: second },
  ]);
  await page.getByRole('button', { name: 'รวม PDF' }).click();
  await expect(page.locator('#merge-result-meta')).toContainText('3 หน้า');

  const threePages = await pdfBuffer(3, 'Three pages');
  await page.goto('./#/tools/pdf-split');
  await page.locator('#split-file').setInputFiles({ name: 'three.pdf', mimeType: 'application/pdf', buffer: threePages });
  await expect(page.locator('#split-file-meta')).toContainText('3 หน้า');
  await page.locator('#split-pages').fill('2-3');
  await page.getByRole('button', { name: 'แยก PDF' }).click();
  await expect(page.locator('#split-result-meta')).toContainText('2 หน้า');
});

test('renders a PDF page to PNG and inspects file metadata', async ({ page }) => {
  const pdf = await pdfBuffer(1, 'Phase 3 Test');
  await page.goto('./#/tools/pdf-to-image');
  await page.locator('#pdf-image-file').setInputFiles({ name: 'render.pdf', mimeType: 'application/pdf', buffer: pdf });
  await expect(page.locator('#pdf-image-file-meta')).toContainText('1 หน้า');
  await page.getByRole('button', { name: 'แปลงหน้านี้เป็นรูป' }).click();
  await expect(page.locator('#pdf-image-preview')).toBeVisible();
  await expect(page.locator('#pdf-image-result-meta')).toContainText('หน้า 1/1');

  await page.goto('./#/tools/file-metadata');
  await page.locator('#metadata-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('#metadata-result')).toBeVisible();
  await expect(page.locator('#metadata-list')).toContainText('notes.txt');
  await expect(page.locator('#metadata-list')).toContainText('SHA-256');
});
