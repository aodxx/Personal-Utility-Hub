import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

function createWavFixture(durationSeconds = 1, sampleRate = 44_100): Buffer {
  const frameCount = Math.floor(durationSeconds * sampleRate);
  const dataSize = frameCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < frameCount; index += 1) {
    const value = Math.round(Math.sin((index / sampleRate) * Math.PI * 2 * 440) * 0.18 * 32767);
    buffer.writeInt16LE(value, 44 + index * 2);
  }
  return buffer;
}

test.describe('Audio processing production contract', () => {
  test('Audio Trimmer completes upload, process, result and download, then can process again', async ({ page }) => {
    await page.goto('./#/tools/audio-trimmer');
    await expect(page.locator('h1', { hasText: 'Audio Trimmer' })).toBeVisible();

    await page.locator('#trim-file').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: createWavFixture() });
    await expect(page.locator('#trim-editor')).toBeVisible();
    await expect(page.locator('#trim-file-meta')).toContainText('tone.wav');
    await expect(page.locator('#trim-waveform')).toBeVisible();

    await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
    await expect(page.locator('#trim-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#trim-result-meta')).toContainText('WAV PCM 16-bit');
    await expect(page.locator('#trim-status')).toContainText('ตัดเสียงสำเร็จ');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /ดาวน์โหลดไฟล์|ดาวน์โหลด WAV/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('tone-trimmed.wav');

    await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
    await expect(page.locator('#trim-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#trim-result-meta')).toContainText('WAV PCM 16-bit');
  });

  for (const tool of [
    ['audio-compressor', 'Audio Resampler (WAV)'],
    ['audio-merger', 'Audio Merger Studio'],
    ['silence-remover', 'Silence Remover'],
    ['audio-finisher', 'Audio Finisher'],
    ['audio-speed-pitch', 'Audio Speed & Pitch'],
  ] as const) {
    test(`${tool[1]} completes the shared audio processing contract`, async ({ page }) => {
      await page.goto(`./#/tools/${tool[0]}`);
      await expect(page.locator('h1', { hasText: tool[1] })).toBeVisible();
      await page.locator('#audio-file').setInputFiles({ name: `${tool[0]}.wav`, mimeType: 'audio/wav', buffer: createWavFixture() });
      await expect(page.locator('#audio-editor')).toBeVisible();
      await expect(page.locator('#audio-waveform')).toBeVisible();
      await page.getByRole('button', { name: 'Export / ประมวลผล' }).click();
      await expect(page.locator('#audio-result')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('#audio-result-meta')).toContainText('Peak');
      await expect(page.locator('#audio-status')).toContainText('Processing complete');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /ดาวน์โหลดไฟล์|ดาวน์โหลด WAV/ }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.wav');
    });
  }

  test('Audio Chapter Marker uploads audio, adds a marker and exports a cue sheet', async ({ page }) => {
    await page.goto('./#/tools/audio-chapter-marker');
    await expect(page.locator('h1', { hasText: 'Audio Chapter Marker & Cue Sheet' })).toBeVisible();
    await page.locator('#chapter-file').setInputFiles({ name: 'chapter-tone.wav', mimeType: 'audio/wav', buffer: createWavFixture() });
    await expect(page.locator('#chapter-status')).toContainText('Audio ready');
    await page.getByRole('button', { name: /เพิ่ม marker/ }).click();
    await expect(page.locator('#chapter-list li')).toHaveCount(1);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export TXT' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('audio-chapters.txt');
  });
});


test.describe('Phase 8 real media corpus', () => {
  const fixture = (name: string) => `tests/fixtures/audio/${name}`;

  for (const input of [
    ['mono-44k.wav', 'audio/wav'],
    ['speech.mp3', 'audio/mpeg'],
    ['voice.m4a', 'audio/mp4'],
    ['speech.ogg', 'audio/ogg'],
    ['voice.webm', 'audio/webm'],
  ] as const) {
    test(`Audio Trimmer real ${input[0]} decode and process`, async ({ page }) => {
      await page.goto('./#/tools/audio-trimmer');
      await expect(page.locator('#trim-file')).toBeVisible();
      await page.locator('#trim-file').setInputFiles({ name: input[0], mimeType: input[1], buffer: readFileSync(fixture(input[0])) });
      await expect(page.locator('#trim-editor')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('#trim-file-meta')).toContainText(input[0]);
      await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
      await expect(page.locator('#trim-result')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('#trim-result-meta')).toContainText('WAV PCM 16-bit');
      const output = page.locator('#trim-output-preview');
      await expect(output).toHaveAttribute('src', /^blob:/);
      const canPlayWav = await page.evaluate(() => new Audio().canPlayType('audio/wav'));
      expect(canPlayWav).not.toBe('');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /ดาวน์โหลดไฟล์|ดาวน์โหลด WAV/ }).click();
      const download = await downloadPromise;
      const downloadedPath = await download.path();
      expect(downloadedPath).not.toBeNull();
      const bytes = readFileSync(downloadedPath!);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString()).toBe('WAVE');
      expect(bytes.length).toBeGreaterThan(44);
    });
  }

  test('Audio Merger real stereo/sample-rate files crossfade and outputs playable WAV', async ({ page }) => {
    await page.goto('./#/tools/audio-merger');
    await page.locator('#audio-file').setInputFiles([
      { name: 'mono-44k.wav', mimeType: 'audio/wav', buffer: readFileSync(fixture('mono-44k.wav')) },
      { name: 'stereo-48k.wav', mimeType: 'audio/wav', buffer: readFileSync(fixture('stereo-48k.wav')) },
    ]);
    await expect(page.locator('#audio-editor')).toBeVisible({ timeout: 15_000 });
    await page.locator('#audio-crossfade').fill('0.2');
    await page.getByRole('button', { name: 'Export / ประมวลผล' }).click();
    await expect(page.locator('#audio-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#audio-result-meta')).toContainText('WAV PCM 16-bit');
    await expect(page.locator('#audio-output-preview')).toHaveAttribute('src', /^blob:/);
  });

  test('Audio Merger exports an MP3 locally with an MP3 filename', async ({ page }) => {
    await page.goto('./#/tools/audio-merger');
    await page.locator('#audio-file').setInputFiles({ name: 'mp3-source.wav', mimeType: 'audio/wav', buffer: createWavFixture(0.5, 44_100) });
    await expect(page.locator('#audio-editor')).toBeVisible({ timeout: 15_000 });
    await page.locator('#audio-format').selectOption('mp3');
    await page.getByRole('button', { name: 'Export / ประมวลผล' }).click();
    await expect(page.locator('#audio-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#audio-result-meta')).toContainText('MP3 128 kbps');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /ดาวน์โหลดไฟล์/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.mp3$/);
    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    expect(readFileSync(downloadedPath!).subarray(0, 2).toString('hex')).toMatch(/^(fffb|fff3|4944)$/);
  });
});


test('Audio Trimmer reports a useful codec/decode error for malformed media', async ({ page }) => {
  await page.goto('./#/tools/audio-trimmer');
  await expect(page.getByText(/Supported on this browser/)).toBeVisible();
  await page.locator('#trim-file').setInputFiles({ name: 'broken.m4a', mimeType: 'audio/mp4', buffer: Buffer.from('not-audio') });
  await expect(page.locator('#trim-status')).toContainText(/WAV|MP3|เปิดไฟล์|decode/i, { timeout: 15_000 });
});
