import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app/app-shell';
import { publicToolCatalog } from '../src/data/tools';

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
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(publicToolCatalog.length);
    expect(root.querySelectorAll('.category-tab .asset-icon')).toHaveLength(13);
    expect(root.querySelectorAll('#tool-grid .tool-card .asset-icon')).toHaveLength(publicToolCatalog.length);
    expect(root.querySelector('#tool-grid [data-tool-id="foundation-demo"]')).toBeNull();
    expect(root.querySelector('.developer-credit')?.textContent).toContain('Developed by aod');
    const facebook = root.querySelector<HTMLAnchorElement>('.developer-credit__social');
    expect(facebook?.getAttribute('href')).toBe('https://www.facebook.com/share/1AWvhjdr44/');
    expect(facebook?.getAttribute('target')).toBe('_blank');
    expect(facebook?.getAttribute('aria-label')).toContain('Facebook');

    const search = root.querySelector<HTMLInputElement>('#tool-search');
    if (!search) throw new Error('missing search input');
    search.value = 'รูปภาพ';
    search.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(12);

    search.value = '';
    search.dispatchEvent(new InputEvent('input', { bubbles: true }));
    root.querySelector<HTMLButtonElement>('[data-category="ข้อความและข้อมูล"]')?.click();
    expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(10);
  });

  it('persists favorites, records recent tools and clears history', async () => {
    const root = startApp();
    await vi.waitFor(() => expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(publicToolCatalog.length));
    const jsonCard = root.querySelector<HTMLElement>('#tool-grid [data-tool-id="json-formatter"]');
    expect(jsonCard?.querySelector('.tool-card__tap-target')?.getAttribute('href')).toBe('#/tools/json-formatter');
    expect(jsonCard?.querySelector('.tool-card__link')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-tool-id="json-formatter"] [data-action="favorite"]')?.click();
    expect(root.querySelector('#favorites-section')?.textContent).toContain('JSON Formatter');
    const favoriteButton = root.querySelector<HTMLButtonElement>('#tool-grid [data-tool-id="json-formatter"] [data-action="favorite"]');
    expect(favoriteButton?.getAttribute('aria-pressed')).toBe('true');
    expect(favoriteButton?.classList.contains('is-bouncing')).toBe(true);
    expect(root.querySelector('#favorite-status')?.textContent).toContain('เพิ่ม JSON Formatter / Validator ในรายการโปรดแล้ว');

    window.location.hash = '#/tools/json-formatter';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.textContent).toContain('จัดรูปแบบและตรวจสอบ JSON'));

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

  it('renders the English Hub and opens the local Settings Center', async () => {
    window.localStorage.setItem('utility-hub:locale', 'en');
    const root = startApp();
    await vi.waitFor(() => expect(root.textContent).toContain('Every tool you need'));
    expect(document.documentElement.lang).toBe('en');
    expect(root.querySelector('[data-category="รูปภาพ"]')?.textContent).toContain('Images');
    expect(root.querySelector('[data-tool-id="image-compressor"]')?.textContent).toContain('Reduce JPEG or WebP');

    root.querySelector<HTMLButtonElement>('#settings-toggle')?.click();
    const dialog = root.querySelector<HTMLDialogElement>('#settings-dialog');
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(dialog?.textContent).toContain('Settings and local data');
    expect(dialog?.querySelectorAll('#compatibility-list li')).toHaveLength(7);
    expect(dialog?.textContent).toContain('No backend');
  });

  it('orders the catalog by locally recorded usage', async () => {
    window.localStorage.setItem('utility-hub:tool-order', 'frequent');
    window.localStorage.setItem('utility-hub:usage', JSON.stringify({ 'pdf-merge': 8, base64: 2 }));
    const root = startApp();
    await vi.waitFor(() => expect(root.querySelectorAll('#tool-grid .tool-card')).toHaveLength(publicToolCatalog.length));
    expect(root.querySelector<HTMLElement>('#tool-grid .tool-card')?.dataset.toolId).toBe('pdf-merge');
  });
});
