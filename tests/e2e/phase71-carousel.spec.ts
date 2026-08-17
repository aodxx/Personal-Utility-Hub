import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('renders centered real visual assets and consistent quick-launch structure for every Most Used card', async ({ page }) => {
  const cards = page.locator('#most-used-carousel .quick-tool-card');
  await expect(cards).toHaveCount(5);
  for (const card of await cards.all()) {
    await expect(card.locator('.quick-tool-card__visual .asset-icon')).toHaveCount(1);
    const cardBox = await card.boundingBox();
    const visual = await card.locator('.quick-tool-card__visual').boundingBox();
    expect(visual?.width ?? 0).toBeGreaterThanOrEqual(72);
    expect(visual?.height ?? 0).toBeGreaterThanOrEqual(72);
    if (cardBox && visual) {
      const cardCenter = cardBox.x + cardBox.width / 2;
      const visualCenter = visual.x + visual.width / 2;
      expect(Math.abs(cardCenter - visualCenter)).toBeLessThanOrEqual(3);
    }
    await expect(card.locator('h3')).toBeVisible();
    await expect(card.locator('p')).toBeVisible();
    await expect(card.locator('.privacy-badge')).toContainText(/ในเครื่อง|On device/);
    await expect(card.locator('.tool-card__arrow')).toHaveText('→');
  }
});

test('uses real local usage ranking and allows frequently used beta tools to enter Most Used', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('utility-hub:usage', JSON.stringify({
      'line-sticker-studio': 25,
      'qr-generator': 4,
      'pdf-merge': 2,
    }));
  });
  await page.reload();
  const cards = page.locator('#most-used-carousel .quick-tool-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toHaveAttribute('data-tool-id', 'line-sticker-studio');
  await expect(cards.nth(1)).toHaveAttribute('data-tool-id', 'qr-generator');
  await expect(cards.nth(2)).toHaveAttribute('data-tool-id', 'pdf-merge');
});

test('uses native snap behavior and updates dots/arrows when navigating', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop controls are intentionally hidden on mobile.');
  const carousel = page.locator('#most-used-carousel');
  const next = page.locator('[data-carousel-action="next"]');
  const previous = page.locator('[data-carousel-action="previous"]');
  await expect(page.locator('.carousel-dot')).toHaveCount(5);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  const styles = await carousel.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { snap: computed.scrollSnapType, behavior: computed.scrollBehavior, overscroll: computed.overscrollBehaviorInline, overflowX: computed.overflowX };
  });
  expect(styles.snap).toContain('x');
  expect(styles.behavior).toBe('smooth');
  expect(styles.overscroll).toBe('contain');
  expect(styles.overflowX).toBe('auto');
  await next.click();
  await expect.poll(async () => Number(await page.locator('.carousel-dot.is-active').getAttribute('data-carousel-index'))).toBeGreaterThan(0);
  await expect(previous).toBeEnabled();
  const beforePrevious = await carousel.evaluate((node) => node.scrollLeft);
  expect(beforePrevious).toBeGreaterThan(0);
  await previous.click();
  await expect.poll(async () => carousel.evaluate((node) => node.scrollLeft)).toBeLessThan(beforePrevious);
  await expect(previous).toBeDisabled();
});

test('keeps mobile cards peekable and hides desktop arrows without page overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'android-entry', 'Mobile-specific visual contract.');
  const carousel = page.locator('#most-used-carousel');
  const first = carousel.locator('.quick-tool-card').first();
  const cardBox = await first.boundingBox();
  const carouselBox = await carousel.boundingBox();
  expect(cardBox?.width ?? 0).toBeGreaterThanOrEqual(0.72 * (carouselBox?.width ?? 1));
  expect(cardBox?.width ?? 0).toBeLessThan(0.86 * (carouselBox?.width ?? 1));
  await expect(page.locator('[data-carousel-action="previous"]')).toBeHidden();
  await expect(page.locator('[data-carousel-action="next"]')).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth);
  expect(overflow).toBe(true);
  const mobileStyles = await carousel.evaluate((node) => {
    const computed = getComputedStyle(node);
    return { snap: computed.scrollSnapType, behavior: computed.scrollBehavior, scrollbar: computed.scrollbarWidth };
  });
  expect(mobileStyles.snap).toContain('x');
  expect(mobileStyles.scrollbar).toBe('none');
});

test('respects reduced motion while preserving snap and controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Reduced-motion contract runs once on desktop.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const styles = await page.locator('#most-used-carousel').evaluate((node) => {
    const carousel = getComputedStyle(node);
    const card = getComputedStyle(node.querySelector('.quick-tool-card')!);
    return { behavior: carousel.scrollBehavior, snap: carousel.scrollSnapType, transition: card.transitionDuration };
  });
  expect(styles.behavior).toBe('auto');
  expect(styles.snap).toContain('x');
  expect(Number.parseFloat(styles.transition)).toBeLessThanOrEqual(0.001);
});
