import { expect, test } from '@playwright/test';

const tools = [
  ['pdf-organizer', 'จัดการหน้า PDF'],
  ['csv-encoding-repair', 'ซ่อม CSV ภาษาไทย'],
  ['json-i18n-mapper', 'JSON i18n Mapper'],
  ['image-watermark', 'ใส่ลายน้ำรูปภาพ'],
  ['json-ld-generator', 'JSON-LD Generator'],
  ['flowchart-studio', 'Flowchart Studio'],
  ['image-crop', 'Circle & Rounded Crop'],
] as const;

for (const [id, heading] of tools) {
  test(`loads ${id} route and local notice`, async ({ page }) => {
    await page.goto(`#/tools/${id}`);
    await expect(page.locator('#tool-container h2')).toContainText(heading);
    await expect(page.locator('.privacy-badge')).toContainText('Local-only');
    await expect(page.locator('#tool-container .tool-status')).toContainText(/ในอุปกรณ์|browser|device/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}
