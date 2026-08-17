import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const fixture = (name: string) => `tests/fixtures/line-sticker/${name}`;

function assertPng(bytes: Buffer): void {
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.subarray(12, 16).toString()).toBe('IHDR');
}

test.describe('LINE Sticker Studio production contract', () => {
  test('static sheet split, edit, inspect, prompt and ZIP export verify real outputs', async ({ page }) => {
    await page.goto('./#/tools/line-sticker-studio');
    await page.selectOption('#line-preset-grid', 'custom');
    await page.selectOption('#line-rows', '2');
    await page.selectOption('#line-columns', '4');
    await expect(page.locator('h1', { hasText: 'LINE Sticker Studio' })).toBeVisible();
    await expect(page.locator('#line-file')).toBeVisible();
    await page.locator('#line-file').setInputFiles({ name: 'geometric-sheet.png', mimeType: 'image/png', buffer: readFileSync(fixture('geometric-sheet.png')) });
    await expect(page.locator('#line-thumbnails .line-thumbnail')).toHaveCount(8);
    await page.locator('#line-clean').click({ force: true });
    await page.locator('#line-autofit').click({ force: true });
    await page.locator('#line-stroke-width').fill('4');
    await page.locator('#line-apply-style').click({ force: true });
    await page.getByRole('button', { name: 'สร้าง Prompt', exact: true }).click({ force: true });
    await expect(page.locator('#line-prompt-en')).toHaveValue(/sticker sheet/);
    await page.getByRole('button', { name: '5 ตรวจและแก้' }).click({ force: true });
    await expect(page.locator('#line-review-report')).toContainText(/PASS|WARNING|FAIL/);

    const downloads: string[] = [];
    page.on('download', async (download) => { const path = await download.path(); if (path) downloads.push(path); });
    await page.getByRole('button', { name: 'ดาวน์โหลด ZIP' }).click({ force: true });
    await expect(page.locator('#line-status')).toContainText('ZIP ถูกสร้างแล้ว', { timeout: 30_000 });
    await expect.poll(() => downloads.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    const zipBytes = readFileSync(downloads[0]!);
    expect(zipBytes.subarray(0, 4).toString()).toBe('PK\x03\x04');
    expect(zipBytes.toString()).toContain('stickers/01.png');
    expect(zipBytes.toString()).toContain('main.png');
    expect(zipBytes.toString()).toContain('tab.png');
    expect(zipBytes.toString()).toContain('validation-report.json');

    const currentDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลดภาพปัจจุบัน', exact: true }).click({ force: true });
    const currentPath = await (await currentDownload).path();
    expect(currentPath).not.toBeNull();
    assertPng(readFileSync(currentPath!));
  });

  test('prompt handoff copies locally, opens external ChatGPT, and never sends prompt to an internal endpoint', async ({ page, context }) => {
    const privatePrompt = 'PRIVATE_STICKER_PROMPT_12345';
    const requests: string[] = [];
    page.on('request', (request) => { if (request.url().includes(privatePrompt) || request.postData()?.includes(privatePrompt)) requests.push(request.url()); });
    await page.goto('./#/tools/line-sticker-studio');
    await page.locator('#line-prompt-character').fill(privatePrompt);
    await page.locator('#line-prompt-phrases').fill('สวัสดี, ขอบคุณ');
    await page.getByRole('button', { name: 'สร้าง Prompt', exact: true }).click();
    await expect(page.locator('#line-prompt-en')).toHaveValue(new RegExp(privatePrompt));
    await page.getByRole('button', { name: 'คัดลอก Prompt', exact: true }).click();
    await expect(page.locator('#line-status')).toContainText('คัดลอก Prompt แล้ว');
    const popup = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'เปิด ChatGPT', exact: true }).click();
    const external = await popup;
    await expect(external).toHaveURL(/chatgpt\.com/);
    expect(requests).toHaveLength(0);
    await context.close();
  });

  test('suggested grid and numbered split preview are visible for a sheet', async ({ page }) => {
    await page.goto('./#/tools/line-sticker-studio');
    await page.locator('#line-preset-grid').selectOption('4x4');
    await page.locator('#line-file').setInputFiles({ name: 'geometric-sheet.png', mimeType: 'image/png', buffer: readFileSync(fixture('geometric-sheet.png')) });
    await expect(page.locator('#line-split-summary')).toContainText('4×4');
    await expect(page.locator('#line-quick-split')).toContainText('ตัด 16 ภาพ');
    await expect(page.locator('#line-grid-overlay .line-grid-cell-number')).toHaveCount(16);
    await expect(page.locator('#line-grid-overlay .line-grid-cell-number').first()).toHaveText('01');
  });

  test('keeps the recovery workflow within a 360px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('./#/tools/line-sticker-studio');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: /คัดลอก Prompt \+ เปิด ChatGPT/ })).toBeVisible();
  });

  test('animated mode prepares frames and reports APNG as partial without fake export', async ({ page }) => {
    await page.goto('./#/tools/line-sticker-studio');
    await page.selectOption('#line-mode', 'animated');
    await page.locator('#line-file').setInputFiles(Array.from({ length: 5 }, (_, index) => ({ name: `frame-${String(index + 1).padStart(2, '0')}.png`, mimeType: 'image/png', buffer: readFileSync(fixture(`frame-${String(index + 1).padStart(2, '0')}.png`)) })));
    await expect(page.locator('#line-thumbnails .line-thumbnail')).toHaveCount(5);
    await page.getByRole('button', { name: 'Validate frames' }).click();
    await expect(page.locator('#line-status')).toContainText(/PASS|Frame count/);
    await expect(page.locator('#line-status')).not.toContainText(/APNG export ready/i);
    await page.getByRole('button', { name: 'Play' }).click();
    await page.getByRole('button', { name: 'Pause' }).click();
  });
});
