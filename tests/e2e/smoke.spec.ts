import { expect, test } from '@playwright/test';

test('searches, filters and saves a favorite', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /เครื่องมือที่ต้องใช้/ })).toBeVisible();
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(8);
  await page.getByRole('searchbox').fill('รูปภาพ');
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(3);
  await page.getByRole('searchbox').fill('JSON');
  await page.getByRole('button', { name: /เพิ่มในรายการโปรด: JSON Formatter/ }).click();
  await expect(page.locator('#favorites-section')).toContainText('JSON Formatter');
});

test('opens a planned tool, records history and toggles theme', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'JSON Formatter / Validator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'เครื่องมือนี้อยู่ในแผน Core Tools' })).toBeVisible();
  await page.getByRole('link', { name: 'กลับหน้า Hub' }).first().click();
  await expect(page.locator('#recent-section')).toContainText('JSON Formatter');
  await page.getByRole('button', { name: 'เปลี่ยนเป็นธีมมืด' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('opens the lazy-loaded lifecycle demo', async ({ page }) => {
  await page.goto('./#/tools/foundation-demo');
  await expect(page.getByRole('heading', { name: 'Lifecycle พร้อมใช้งาน' })).toBeVisible();
  await page.getByRole('button', { name: 'ทดสอบ Event Listener' }).click();
  await expect(page.getByText('Event listener ทำงาน 1 ครั้งใน session นี้')).toBeVisible();
});

test('renders a not-found route', async ({ page }) => {
  await page.goto('./#/missing-route');
  await expect(page.getByRole('heading', { name: 'ไม่พบหน้าที่คุณต้องการ' })).toBeVisible();
});
