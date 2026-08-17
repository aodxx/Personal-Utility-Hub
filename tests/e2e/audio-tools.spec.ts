import { expect, test } from '@playwright/test';

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
    await page.getByRole('button', { name: 'ดาวน์โหลด WAV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('tone-trimmed.wav');

    await page.getByRole('button', { name: 'ตัดเสียงและสร้าง WAV' }).click();
    await expect(page.locator('#trim-result')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#trim-result-meta')).toContainText('WAV PCM 16-bit');
  });

  for (const tool of [
    ['audio-compressor', 'Audio Compressor Pro'],
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
      await page.getByRole('button', { name: 'ดาวน์โหลด WAV / Download' }).click();
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
