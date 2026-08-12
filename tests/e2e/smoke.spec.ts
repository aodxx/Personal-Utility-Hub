import { expect, test } from '@playwright/test';

test('searches, filters and saves a favorite', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /เครื่องมือที่ต้องใช้/ })).toBeVisible();
  const iconResponse = await page.request.get('./icons/utility-3d-icons.svg');
  expect(iconResponse.ok()).toBeTruthy();
  await expect(page.locator('.hero .asset-icon--hero')).toBeVisible();
  await expect(page.locator('.category-tab .asset-icon')).toHaveCount(8);
  await expect(page.locator('#tool-grid .tool-card .asset-icon')).toHaveCount(14);
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(14);
  await page.getByRole('searchbox').fill('รูปภาพ');
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(6);
  await page.getByRole('searchbox').fill('JSON');
  await page.getByRole('button', { name: /เพิ่มในรายการโปรด: JSON Formatter/ }).click();
  await expect(page.locator('#favorites-section')).toContainText('JSON Formatter');
});

test('keeps mobile tool cards compact with clear touch feedback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ layout ที่ viewport 360px โดยตรง');
  await page.goto('./');

  const cards = page.locator('#tool-grid .tool-card');
  await expect(cards).toHaveCount(14);
  const firstCard = cards.first();
  const firstBox = await firstCard.boundingBox();
  expect(firstBox).not.toBeNull();
  await page.evaluate((top) => window.scrollTo(0, top), Math.max(0, (firstBox?.y ?? 0) - 8));

  const visibleCards = await cards.evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }).length);
  expect(visibleCards).toBeGreaterThanOrEqual(3);

  const visualBox = await firstCard.locator('.tool-card__visual').boundingBox();
  const headingBox = await firstCard.getByRole('heading').boundingBox();
  expect(visualBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(visualBox!.x).toBeLessThan(headingBox!.x);

  const category = page.getByRole('button', { name: 'ข้อความและข้อมูล' });
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');

  const favorite = page.locator('#tool-grid [data-tool-id="base64"] [data-action="favorite"]');
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#favorite-status')).toContainText('เพิ่ม Base64 Encoder / Decoder ในรายการโปรดแล้ว');
});

test('opens an active tool, records history and toggles theme', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'JSON Formatter / Validator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'จัดรูปแบบและตรวจสอบ JSON' })).toBeVisible();
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
