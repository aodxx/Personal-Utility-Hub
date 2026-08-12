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
