import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app/app-shell';

describe('AppShell integration', () => {
  let app: AppShell | undefined;

  afterEach(() => {
    app?.stop();
    app = undefined;
    window.location.hash = '';
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.body.replaceChildren();
  });

  function startApp(): HTMLElement {
    window.location.hash = '#/';
    const root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
    app = new AppShell(root);
    app.start();
    return root;
  }

  it('renders the Hub and filters tools by Thai search and category', async () => {
    const root = startApp();
    await vi.waitFor(() => expect(root.textContent).toContain('เครื่องมือที่ต้องใช้'));
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(8);

    const search = root.querySelector<HTMLInputElement>('#tool-search');
    if (!search) throw new Error('missing search input');
    search.value = 'รูปภาพ';
    search.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(3);

    search.value = '';
    search.dispatchEvent(new InputEvent('input', { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-category="ข้อความและข้อมูล"]')?.click();
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(2);
  });

  it('persists favorites, records recent tools and clears history', async () => {
    const root = startApp();
    await vi.waitFor(() => expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(8));
    root.querySelector<HTMLButtonElement>('[data-tool-id="json-formatter"] [data-action="favorite"]')?.click();
    expect(root.querySelector('#favorites-section')?.textContent).toContain('JSON Formatter');

    window.location.hash = '#/tools/json-formatter';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.textContent).toContain('เครื่องมือนี้อยู่ในแผน Core Tools'));

    window.location.hash = '#/';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.querySelector('#recent-section')?.textContent).toContain('JSON Formatter'));
    root.querySelector<HTMLButtonElement>('[data-action="clear-recent"]')?.click();
    expect(root.querySelector('#recent-section')?.textContent).toContain('ยังไม่มีประวัติ');
  });

  it('lazy-loads the lifecycle demo and toggles the theme', async () => {
    const root = startApp();
    root.querySelector<HTMLButtonElement>('#theme-toggle')?.click();
    expect(document.documentElement.dataset.theme).toBe('dark');

    window.location.hash = '#/tools/foundation-demo';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.textContent).toContain('Lifecycle พร้อมใช้งาน'));
    root.querySelector<HTMLButtonElement>('.demo-panel button')?.click();
    expect(root.textContent).toContain('Event listener ทำงาน 1 ครั้ง');
  });

  it('renders a not-found page', async () => {
    window.location.hash = '#/missing';
    const root = document.createElement('div');
    document.body.append(root);
    app = new AppShell(root);
    app.start();
    await vi.waitFor(() => expect(root.textContent).toContain('ไม่พบหน้าที่คุณต้องการ'));
  });
});
