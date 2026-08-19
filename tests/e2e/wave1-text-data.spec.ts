import { test, expect } from '@playwright/test';

test.describe('Wave 1 Text/Data tools', () => {
  test('generates JSON Schema from Thai JSON and handles invalid input', async ({ page }) => {
    await page.goto('./#/tools/json-schema-generator');
    await expect(page.getByRole('heading', { name: 'JSON Schema Generator' })).toBeVisible();
    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await page.getByRole('button', { name: /สร้าง Schema/ }).click();
    await expect(page.locator('#schema-output')).toHaveValue(/2020-12/);
    await expect(page.locator('#schema-output')).toHaveValue(/members/);
    await page.locator('#schema-input').fill('{broken');
    await page.getByRole('button', { name: /สร้าง Schema/ }).click();
    await expect(page.locator('#schema-status')).toHaveAttribute('data-tone', 'error');
  });

  test('builds Markdown table from CSV and escapes pipe cells without overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ mobile overflow ที่ viewport 360px โดยตรง');
    await page.goto('./#/tools/markdown-table-builder');
    await expect(page.getByRole('heading', { name: 'Markdown Table Builder' })).toBeVisible();
    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await page.getByRole('button', { name: /สร้างตาราง/ }).click();
    await expect(page.locator('#table-output')).toHaveValue(/\| Name/);
    await page.locator('#table-input').fill('Name,Note\nAod,"a | b"');
    await page.getByRole('button', { name: /สร้างตาราง/ }).click();
    await expect(page.locator('#table-output')).toHaveValue(/a \\\\| b/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
