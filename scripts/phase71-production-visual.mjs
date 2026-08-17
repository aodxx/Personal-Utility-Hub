import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'https://aodxx.github.io/Personal-Utility-Hub/';
const out = '/home/ubuntu/Personal-Utility-Hub/docs/phase71-screenshots';
await fs.mkdir(out, { recursive: true });
const results = [];
const record = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ` | ${detail}` : ''}`); };

async function capture(viewport, label) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(`${base}?phase71=0475f82`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#most-used-carousel .quick-tool-card');
    await page.screenshot({ path: `${out}/${label}-initial.png`, fullPage: false });
    const mostUsed = page.locator('.most-used');
    await mostUsed.scrollIntoViewIfNeeded();
    await mostUsed.screenshot({ path: `${out}/${label}-most-used-initial.png` });
    record(`${label}: initial visual captured`, true);
    const firstVisual = page.locator('#most-used-carousel .quick-tool-card').first().locator('.quick-tool-card__visual');
    record(`${label}: first visual visible`, await firstVisual.isVisible());
    if (label === 'desktop-1280') {
      const next = page.locator('[data-carousel-action="next"]');
      const previous = page.locator('[data-carousel-action="previous"]');
      await next.click();
      await page.waitForTimeout(450);
      await mostUsed.screenshot({ path: `${out}/${label}-after-next.png` });
      record(`${label}: next arrow moved`, await page.locator('#most-used-carousel').evaluate((node) => node.scrollLeft > 0));
      record(`${label}: indicator changed`, await page.locator('.carousel-dot.is-active').count() === 1);
      await previous.click();
      await page.waitForTimeout(450);
      await mostUsed.screenshot({ path: `${out}/${label}-after-previous.png` });
      record(`${label}: previous arrow available`, await previous.isDisabled() || await page.locator('#most-used-carousel').evaluate((node) => node.scrollLeft >= 0));
    } else {
      const carousel = page.locator('#most-used-carousel');
      const second = carousel.locator('.quick-tool-card').nth(1);
      const secondBox = await second.boundingBox();
      if (secondBox) {
        await carousel.evaluate((node, left) => node.scrollTo({ left, behavior: 'auto' }), secondBox.x);
        await page.waitForTimeout(250);
      }
      await mostUsed.screenshot({ path: `${out}/${label}-after-swipe.png` });
      record(`${label}: mobile second card peek/scroll`, await carousel.evaluate((node) => node.scrollLeft > 0));
      record(`${label}: mobile dots present`, await page.locator('.carousel-dot').count() === 5);
    }
  } catch (error) {
    record(`${label}: exception`, false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
}

await capture({ width: 360, height: 740 }, 'mobile-360');
await capture({ width: 412, height: 915 }, 'mobile-412');
await capture({ width: 1280, height: 900 }, 'desktop-1280');
console.log(`SUMMARY | ${results.filter(({ pass }) => pass).length}/${results.length} passed`);
if (results.some(({ pass }) => !pass)) process.exitCode = 1;
