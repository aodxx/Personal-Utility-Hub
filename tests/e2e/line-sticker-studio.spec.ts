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
    await expect(page.locator('h1', { hasText: 'LINE Sticker Studio' })).toBeVisible();
    await expect(page.locator('#line-file')).toBeVisible();
    await page.locator('#line-file').setInputFiles({ name: 'geometric-sheet.png', mimeType: 'image/png', buffer: readFileSync(fixture('geometric-sheet.png')) });
    await expect(page.locator('#line-thumbnails .line-thumbnail')).toHaveCount(8);
    await page.locator('#line-clean').click({ force: true });
    await page.locator('#line-autofit').click({ force: true });
    await page.locator('#line-stroke-width').fill('4');
    await page.locator('#line-apply-style').click({ force: true });
    await page.getByRole('button', { name: 'Generate prompt' }).click({ force: true });
    await expect(page.locator('#line-prompt-en')).toHaveValue(/sticker sheet/);
    await page.getByRole('button', { name: '4 Review' }).click({ force: true });
    await expect(page.locator('#line-review-report')).toContainText(/PASS|WARNING|FAIL/);

    const downloads: string[] = [];
    page.on('download', async (download) => { const path = await download.path(); if (path) downloads.push(path); });
    await page.getByRole('button', { name: 'Export PNG + ZIP + reports' }).click({ force: true });
    await expect(page.locator('#line-status')).toContainText('ZIP ready', { timeout: 30_000 });
    await expect.poll(() => downloads.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    const zipBytes = readFileSync(downloads[0]!);
    expect(zipBytes.subarray(0, 4).toString()).toBe('PK\x03\x04');
    expect(zipBytes.toString()).toContain('stickers/01.png');
    expect(zipBytes.toString()).toContain('main.png');
    expect(zipBytes.toString()).toContain('tab.png');
    expect(zipBytes.toString()).toContain('validation-report.json');

    const currentDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download current PNG' }).click({ force: true });
    const currentPath = await (await currentDownload).path();
    expect(currentPath).not.toBeNull();
    assertPng(readFileSync(currentPath!));
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
