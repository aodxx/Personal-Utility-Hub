import { expect, test, type Page } from '@playwright/test';

const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dGlsaXR5LWh1YiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoidmlld2VyIn0.demo-signature';

async function expectNoOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe('P0 tools desktop workflows', () => {
  test('JWT Inspector decodes header, payload and claims locally', async ({ page }) => {
    await page.goto('#/tools/jwt-inspector');
    await expect(page.locator('#tool-container h2')).toContainText('JWT Inspector');
    await page.locator('#jwt-input').fill(sampleJwt);
    await page.locator('[data-jwt-action="inspect"]').click();
    await expect(page.locator('#jwt-result')).toBeVisible();
    await expect(page.locator('#jwt-summary-meta')).toContainText('HS256');
    await expect(page.locator('#jwt-expiry')).toContainText('ยังไม่หมดอายุ');
    await page.locator('[data-jwt-tab="claims"]').click();
    await expect(page.locator('#jwt-claims-body')).toContainText('utility-hub');
    await expect(page.locator('#jwt-warning-list')).toContainText('ไม่ใช่การยืนยันลายเซ็น');
    await expect(page.locator('.privacy-badge')).toContainText('Local-only');
    await expectNoOverflow(page);
  });

  test('Hash Verifier calculates text and compares expected digest', async ({ page }) => {
    await page.goto('#/tools/hash-verifier');
    await page.locator('#hash-text').fill('hello');
    await page.locator('#hash-expected').fill('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    await page.locator('#hash-calculate').click();
    await expect(page.locator('#hash-result')).toBeVisible();
    await expect(page.locator('#hash-digest')).toHaveText('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    await expect(page.locator('#hash-verdict')).toContainText('MATCH');
    await expectNoOverflow(page);
  });

  test('Hash Verifier supports a local file input', async ({ page }) => {
    await page.goto('#/tools/hash-verifier');
    await page.locator('[data-hash-mode="file"]').click();
    await page.locator('#hash-file').setInputFiles({ name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    await page.locator('#hash-calculate').click();
    await expect(page.locator('#hash-result')).toBeVisible();
    await expect(page.locator('#hash-input-meta')).toContainText('hello.txt');
    await expect(page.locator('#hash-status')).toContainText(/สำเร็จ|locally/i);
  });

  test('Regex Playground shows matches, captures and highlighted preview', async ({ page }) => {
    await page.goto('#/tools/regex-playground');
    await page.locator('#regex-pattern').fill('(?<name>[A-Za-z]+)');
    await page.locator('#regex-input').fill('Hello Hub');
    await page.locator('[data-regex-action="run"]').click();
    await expect(page.locator('#regex-result')).toBeVisible();
    await expect(page.locator('#regex-summary')).toContainText('2 matches');
    await expect(page.locator('#regex-highlighted mark')).toHaveCount(2);
    await expect(page.locator('#regex-match-list')).toContainText('groups');
    await expectNoOverflow(page);
  });

  test('Color Contrast Checker reports WCAG decisions and preview', async ({ page }) => {
    await page.goto('#/tools/color-contrast');
    await page.locator('#contrast-foreground-hex').fill('#000000');
    await page.locator('#contrast-background-hex').fill('#FFFFFF');
    await page.locator('[data-contrast-action="calculate"]').click();
    await expect(page.locator('#contrast-result')).toBeVisible();
    await expect(page.locator('#contrast-ratio')).toHaveText('21.00:1');
    await expect(page.locator('#contrast-normal-aa')).toContainText('PASS');
    await expect(page.locator('#contrast-normal-aaa')).toContainText('PASS');
    await expect(page.locator('#contrast-preview')).toHaveCSS('color', 'rgb(0, 0, 0)');
    await expectNoOverflow(page);
  });
});

test.describe('P0 tools mobile routes', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  for (const [id, heading] of [
    ['jwt-inspector', 'JWT Inspector'],
    ['hash-verifier', 'Hash & Checksum Verifier'],
    ['regex-playground', 'Regex Playground'],
    ['color-contrast', 'Color Contrast Checker'],
  ] as const) {
    test(`loads ${id} on mobile without overflow`, async ({ page }) => {
      await page.goto(`#/tools/${id}`);
      await expect(page.locator('#tool-container h2')).toContainText(heading);
      await expect(page.locator('.privacy-badge')).toContainText('Local-only');
      await expectNoOverflow(page);
    });
  }
});
