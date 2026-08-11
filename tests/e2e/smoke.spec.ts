import { expect, test } from '@playwright/test';

test('opens the Hub and lazy-loaded demo tool', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /เครื่องมือเล็ก ๆ/ })).toBeVisible();
  await page.getByRole('link', { name: 'เปิด Lifecycle Demo' }).click();
  await expect(page.getByRole('heading', { name: 'Lifecycle พร้อมใช้งาน' })).toBeVisible();
  await page.getByRole('button', { name: 'ทดสอบ Event Listener' }).click();
  await expect(page.getByText('Event listener ทำงาน 1 ครั้งใน session นี้')).toBeVisible();
});

test('renders a not-found route', async ({ page }) => {
  await page.goto('./#/missing-route');
  await expect(page.getByRole('heading', { name: 'ไม่พบหน้าที่คุณต้องการ' })).toBeVisible();
});
