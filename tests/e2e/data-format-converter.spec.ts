import { expect, test } from '@playwright/test';

test.describe('Data Format Converter', () => {
  test('converts JSON to YAML, shows conversion notes, and supports swap', async ({ page }) => {
    await page.goto('./#/tools/data-format-converter');
    await expect(page.getByRole('heading', { level: 2, name: /Data Format Converter/ })).toBeVisible();
    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await page.getByRole('button', { name: /แปลงข้อมูล/ }).click();
    await expect(page.locator('#data-format-result')).toHaveValue(/name: Utility Hub/);
    await expect(page.locator('#data-format-warnings')).toBeVisible();
    await page.getByRole('button', { name: /สลับทิศทาง/ }).click();
    await expect(page.locator('#data-format-source-format')).toHaveValue('yaml');
    await expect(page.locator('#data-format-target-format')).toHaveValue('json');
    await expect(page.locator('#data-format-source')).toHaveValue(/name: Utility Hub/);
    await expect(page.locator('#data-format-result')).toHaveValue('');

    await page.locator('#data-format-source').fill('name: [broken');
    await page.getByRole('button', { name: /แปลงข้อมูล/ }).click();
    await expect(page.locator('#data-format-status')).toHaveAttribute('data-tone', 'error');
    await expect(page.locator('#data-format-status')).toContainText(/line/i);
  });

  test('keeps the converter usable without horizontal overflow on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ mobile overflow ที่ viewport 360px โดยตรง');
    await page.goto('./#/tools/data-format-converter');
    await expect(page.getByRole('heading', { level: 2, name: /Data Format Converter/ })).toBeVisible();
    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await page.getByRole('button', { name: /แปลงข้อมูล/ }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
