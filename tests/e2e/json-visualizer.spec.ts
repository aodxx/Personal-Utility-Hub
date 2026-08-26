import { expect, test } from '@playwright/test';

test.describe('JSON Visualizer / Graph Viewer', () => {
  test('loads sample, explores tree and graph, then exports SVG', async ({ page }) => {
    await page.goto('./#/tools/json-visualizer');
    await expect(page.getByRole('heading', { level: 2, name: /สำรวจ JSON/ })).toBeVisible();
    await expect(page.getByText('Local-only')).toBeVisible();

    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    await expect(page.locator('#json-visualizer-status')).toHaveAttribute('data-tone', 'success');
    await expect(page.locator('#json-visualizer-tree li')).toHaveCount(12);
    await expect(page.locator('#json-visualizer-graph svg')).toBeVisible();
    await expect(page.locator('#json-visualizer-graph svg')).toHaveAttribute('role', 'img');

    const rootToggle = page.locator('[data-json-visualizer-action="toggle"]').first();
    await expect(rootToggle).toHaveAttribute('aria-expanded', 'true');
    await rootToggle.click();
    await expect(rootToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#json-visualizer-tree li')).toHaveCount(1);

    await page.getByRole('button', { name: /ขยายทั้งหมด/ }).click();
    await expect(page.locator('#json-visualizer-tree li')).toHaveCount(12);
    await page.locator('#json-visualizer-search').fill('privacy');
    await expect(page.locator('#json-visualizer-tree')).toContainText('$.privacy');
    await expect(page.locator('#json-visualizer-graph svg')).toContainText('privacy');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /ส่งออก SVG/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('json-visualizer.svg');
    await expect(page.locator('#json-visualizer-status')).toContainText(/SVG exported/);
  });

  test('shows actionable errors and stays within the mobile viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'android-entry', 'ตรวจ mobile overflow ที่ viewport 360px โดยตรง');
    await page.goto('./#/tools/json-visualizer');
    await expect(page.getByRole('heading', { level: 2, name: /สำรวจ JSON/ })).toBeVisible();
    await page.locator('#json-visualizer-input').fill('{"broken":');
    await page.getByRole('button', { name: /สร้างภาพ/ }).click();
    await expect(page.locator('#json-visualizer-status')).toHaveAttribute('data-tone', 'error');
    await expect(page.locator('#json-visualizer-status')).toContainText(/JSON/);

    await page.getByRole('button', { name: /ลองข้อมูลตัวอย่าง/ }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
