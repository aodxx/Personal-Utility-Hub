import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('formats JSON, round-trips Thai Base64 and cleans text', async ({ page }) => {
  await page.goto('./#/tools/json-formatter');
  await page.locator('#json-input').fill('{"project":"Utility Hub","active":true}');
  await page.getByRole('button', { name: 'จัดรูปแบบ', exact: true }).click();
  await expect(page.locator('#json-result')).toHaveValue(/\n  "project": "Utility Hub"/);
  await expect(page.locator('#json-status')).toContainText('สำเร็จ');

  await page.goto('./#/tools/base64');
  await page.locator('#base64-input').fill('สวัสดี Utility Hub 🌿');
  await page.getByRole('button', { name: 'เข้ารหัส', exact: true }).click();
  const encoded = await page.locator('#base64-result').inputValue();
  expect(encoded).not.toContain('สวัสดี');
  await page.locator('#base64-input').fill(encoded);
  await page.getByRole('button', { name: 'ถอดรหัส', exact: true }).click();
  await expect(page.locator('#base64-result')).toHaveValue('สวัสดี Utility Hub 🌿');

  await page.goto('./#/tools/text-formatter');
  await page.locator('#text-input').fill('  one   two  \n\n three  ');
  await page.getByRole('button', { name: 'รวมช่องว่างซ้ำ' }).click();
  await expect(page.locator('#text-input')).toHaveValue('one two\n\nthree');
  await expect(page.locator('#text-stats')).toContainText('3 คำ');
});

test('generates and reads a QR image fully client-side', async ({ page }) => {
  const value = 'https://aodxx.github.io/Personal-Utility-Hub/';
  await page.goto('./#/tools/qr-generator');
  await page.locator('#qr-content').fill(value);
  await page.getByRole('button', { name: 'สร้าง QR Code' }).click();
  await expect(page.locator('#qr-image')).toBeVisible();
  await expect(page.locator('#qr-image')).toHaveAttribute('src', /^data:image\/png;base64,/);

  const qrBuffer = await QRCode.toBuffer(value, { width: 360, margin: 3 });
  await page.goto('./#/tools/qr-reader');
  await page.locator('#qr-reader-file').setInputFiles({ name: 'hub-qr.png', mimeType: 'image/png', buffer: qrBuffer });
  await expect(page.locator('#qr-reader-result')).toHaveValue(value);
  await expect(page.locator('#qr-reader-status')).toContainText('สำเร็จ');
});

test('resizes and converts an image without uploading it', async ({ page }) => {
  await page.goto('./#/tools/image-resizer');
  await page.locator('#resize-file').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: onePixelPng });
  await expect(page.locator('#resize-file-meta')).toContainText('1 × 1 px');
  await page.locator('#resize-width').fill('2');
  await expect(page.locator('#resize-height')).toHaveValue('2');
  await page.getByRole('button', { name: 'ปรับขนาดรูปภาพ' }).click();
  await expect(page.locator('#resize-result')).toBeVisible();
  await expect(page.locator('#resize-result-meta')).toContainText('2 × 2 px');

  await page.goto('./#/tools/image-converter');
  await page.locator('#convert-file').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.getByRole('button', { name: 'แปลงรูปภาพ' }).click();
  await expect(page.locator('#convert-result')).toBeVisible();
  await expect(page.locator('#convert-result-meta')).toContainText('WEBP');
});
