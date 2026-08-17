import { expect, test } from '@playwright/test';

test('searches, filters and saves a favorite', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /เครื่องมือที่ต้องใช้/ })).toBeVisible();
  const iconResponse = await page.request.get('./icons/utility-3d-icons.svg');
  expect(iconResponse.ok()).toBeTruthy();
  await expect(page.locator('.hero .asset-icon--hero')).toBeVisible();
  await expect(page.locator('.category-tab .asset-icon')).toHaveCount(8);
  await expect(page.locator('#tool-grid .tool-card .asset-icon')).toHaveCount(25);
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(25);
  await page.getByRole('searchbox').fill('รูปภาพ');
  await expect(page.locator('#tool-grid .tool-card')).toHaveCount(7);
  await page.getByRole('searchbox').fill('JSON');
  await page.getByRole('button', { name: /เพิ่มในรายการโปรด: JSON Formatter/ }).click();
  await expect(page.locator('#favorites-section')).toContainText('JSON Formatter');
});

test('keeps mobile tool cards compact with clear touch feedback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ layout ที่ viewport 360px โดยตรง');
  await page.goto('./');

  const cards = page.locator('#tool-grid .tool-card');
  await expect(cards).toHaveCount(25);
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
  const footerBox = await firstCard.locator('.tool-card__footer').boundingBox();
  expect(visualBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(visualBox!.x).toBeLessThan(headingBox!.x);
  expect(visualBox!.y + visualBox!.height).toBeLessThanOrEqual(footerBox!.y);

  const category = page.getByRole('button', { name: 'ข้อความและข้อมูล' });
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');

  const favorite = page.locator('#tool-grid [data-tool-id="base64"] [data-action="favorite"]');
  const hubUrl = page.url();
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#favorite-status')).toContainText('เพิ่ม Base64 Encoder / Decoder ในรายการโปรดแล้ว');
  expect(page.url()).toBe(hubUrl);

  const base64Card = page.locator('#tool-grid [data-tool-id="base64"]');
  await base64Card.click({ position: { x: 120, y: 36 } });
  await expect(page).toHaveURL(/#\/tools\/base64$/);
  await expect(page.locator('main .tool-heading > h1')).toHaveText('Base64 Encoder / Decoder');
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


test('explains privacy and opens the shared bilingual tool guide', async ({ page }) => {
  await page.goto('./#/privacy');
  await expect(page.getByRole('heading', { name: 'ข้อมูลของคุณไปไหน?' })).toBeVisible();
  await expect(page.locator('.privacy-flow > div')).toHaveCount(5);
  await expect(page.getByRole('link', { name: /ตรวจสอบ source code/ })).toHaveAttribute('href', /github.com\/aodxx\/Personal-Utility-Hub/);

  await page.goto('./#/tools/json-formatter');
  await expect(page.getByRole('button', { name: /อ่านวิธีใช้|วิธีใช้งาน/ }).first()).toBeVisible();
  await page.getByRole('button', { name: /วิธีใช้งาน|อ่านวิธีใช้/ }).first().click();
  const dialog = page.getByRole('dialog', { name: 'วิธีใช้งาน' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Input');
  await expect(dialog).toContainText('ข้อจำกัด');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('supports first-use dismissal and safe sample data', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./#/tools/json-formatter');
  await expect(page.locator('[data-first-use="json-formatter"]')).toBeVisible();
  await page.getByRole('button', { name: 'ข้าม' }).click();
  await expect(page.locator('[data-first-use="json-formatter"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-first-use="json-formatter"]')).toHaveCount(0);
  await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
  await expect(page.locator('#json-input')).toHaveValue(/Utility Hub/);
  await expect(page.locator('#json-status')).toContainText('Sample data loaded');
});

test('keeps the guide usable on 360px mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ guide sheet บน viewport 360px โดยตรง');
  await page.goto('./#/tools/audio-trimmer');
  await page.getByRole('button', { name: /วิธีใช้งาน|อ่านวิธีใช้/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(360);
  await page.keyboard.press('Escape');
});


test('shows tool-specific guide content across representative categories', async ({ page }) => {
  const cases = [
    { route: 'json-formatter', marker: 'JSON text' },
    { route: 'qr-reader', marker: 'เบลอ' },
    { route: 'image-compressor', marker: 'lossless' },
    { route: 'pdf-merge', marker: 'encrypted' },
    { route: 'audio-trimmer', marker: 'WAV' },
    { route: 'audio-finisher', marker: 'LUFS' },
    { route: 'audio-speed-pitch', marker: 'resampling' },
  ];
  for (const item of cases) {
    await page.goto(`./#/tools/${item.route}`);
    await page.getByRole('button', { name: /วิธีใช้งาน|อ่านวิธีใช้/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(item.marker, { ignoreCase: true });
    await page.keyboard.press('Escape');
  }
});
