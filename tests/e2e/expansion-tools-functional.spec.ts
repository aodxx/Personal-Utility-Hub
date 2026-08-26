import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

async function pdfBuffer(pages: number): Promise<Buffer> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pages; index += 1) document.addPage([320, 480]);
  return Buffer.from(await document.save());
}

test('organizes PDF pages locally and downloads a result', async ({ page }) => {
  await page.goto('./#/tools/pdf-organizer');
  await page.locator('#pdf-organizer-file').setInputFiles({ name: 'organize.pdf', mimeType: 'application/pdf', buffer: await pdfBuffer(3) });
  await expect(page.locator('#pdf-organizer-file-meta')).toContainText('3 หน้า');
  await page.locator('#pdf-organizer-order').fill('3,1,2');
  await page.locator('#pdf-organizer-delete').fill('2');
  await page.locator('#pdf-organizer-watermark').fill('Internal');
  await page.getByRole('button', { name: /จัดการ PDF/ }).click();
  await expect(page.locator('#pdf-organizer-result')).toBeVisible();
  await expect(page.locator('#pdf-organizer-result-meta')).toContainText('2 หน้า');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /ดาวน์โหลด PDF/ }).click();
  expect((await download).suggestedFilename()).toMatch(/organized\.pdf$/);
});

test('repairs CSV encoding and exports UTF-8 BOM', async ({ page }) => {
  await page.goto('./#/tools/csv-encoding-repair');
  await page.locator('#csv-repair-file').setInputFiles({ name: 'thai.csv', mimeType: 'text/csv', buffer: Buffer.from('ชื่อ,จำนวน\nทดสอบ,2', 'utf8') });
  await expect(page.locator('#csv-repair-preview')).toContainText('ทดสอบ');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /ส่งออก UTF-8 BOM/ }).click();
  expect((await download).suggestedFilename()).toMatch(/utf8\.csv$/);
  await expect(page.locator('#csv-repair-result')).toBeVisible();
});

test('maps i18n JSON keys and creates a skeleton', async ({ page }) => {
  await page.goto('./#/tools/json-i18n-mapper');
  await page.locator('#i18n-base').fill('{"app":{"title":"Title","save":"Save"}}');
  await page.locator('#i18n-target').fill('{"app":{"title":"ชื่อ"},"old":"เก่า"}');
  await page.getByRole('button', { name: /เปรียบเทียบ/ }).click();
  await expect(page.locator('#i18n-missing')).toContainText('app.save');
  await expect(page.locator('#i18n-extra')).toContainText('old');
  await expect(page.locator('#i18n-skeleton')).toHaveValue(/TODO: Save/);
});

test('watermarks an image and downloads the result', async ({ page }) => {
  await page.goto('./#/tools/image-watermark');
  await page.locator('#watermark-files').setInputFiles({ name: 'source.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.locator('#watermark-text').fill('Review');
  await page.getByRole('button', { name: /ใส่ลายน้ำ/ }).click();
  await expect(page.locator('#watermark-results .result-card')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /ดาวน์โหลด/ }).click();
  expect((await download).suggestedFilename()).toMatch(/watermarked\.(png|webp|jpg)$/);
});

test('generates JSON-LD and provides JSON output', async ({ page }) => {
  await page.goto('./#/tools/json-ld-generator');
  await page.locator('#ld-type').selectOption('Product');
  await page.locator('#ld-name').fill('Notebook');
  await page.locator('#ld-url').fill('https://example.com/notebook');
  await page.locator('#ld-price').fill('12.5');
  await page.getByRole('button', { name: /สร้าง JSON-LD/ }).click();
  await expect(page.locator('#ld-output')).toHaveValue(/Product/);
  await expect(page.locator('#ld-script')).toHaveValue(/application\/ld\+json/);
});

test('renders and exports a flowchart', async ({ page }) => {
  await page.goto('./#/tools/flowchart-studio');
  await page.locator('#flowchart-dsl').fill('รับคำขอ -> ตรวจสอบ -> เสร็จสิ้น');
  await page.getByRole('button', { name: /สร้างแผนผัง/ }).click();
  await expect(page.locator('#flowchart-preview svg')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('flowchart.svg');
});

test('creates a circle crop and downloads transparent PNG', async ({ page }) => {
  await page.goto('./#/tools/image-crop');
  await page.locator('#crop-file').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.getByRole('button', { name: /ครอบรูป/ }).click();
  await expect(page.locator('#crop-result')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /ดาวน์โหลด/ }).click();
  expect((await download).suggestedFilename()).toMatch(/-circle\.png$/);
});
