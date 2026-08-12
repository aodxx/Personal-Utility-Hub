import { getErrorMessage, ToolNotFoundError } from '../core/errors';
import { PwaController } from '../core/pwa';
import { filterTools } from '../core/search';
import { LocalPreferences, type ThemePreference } from '../core/storage';
import type { ToolMetadata } from '../core/tool-contract';
import { ToolLoader } from '../core/tool-loader';
import { assetIcon, toolAssetIcon } from '../components/asset-icon';
import { allCategories } from '../data/categories';
import { toolCatalog, toolRegistry } from '../data/tools';
import { categoryVisuals } from '../data/visual-assets';
import { HashRouter } from './router';
import type { AppRoute } from './routes';

export class AppShell {
  private readonly router = new HashRouter();
  private readonly toolLoader = new ToolLoader(toolRegistry);
  private readonly preferences = new LocalPreferences();
  private readonly pwa = new PwaController();
  private navigationId = 0;
  private cleanupHome: (() => void) | undefined;
  private themeButton: HTMLButtonElement | undefined;

  constructor(private readonly root: HTMLElement) {}

  start(): void {
    this.root.innerHTML = `
      <a class="skip-link" href="#main-content">ข้ามไปยังเนื้อหา</a>
      <header class="site-header">
        <a class="brand" href="#/" aria-label="Personal Utility Hub หน้าแรก">
          <span class="brand__mark" aria-hidden="true">U</span>
          <span><strong>Utility Hub</strong><small>Private by design</small></span>
        </a>
        <div class="header-actions">
          <button id="install-app" class="icon-button icon-button--install" type="button" aria-label="ติดตั้งแอป">ติดตั้ง</button>
          <button id="theme-toggle" class="icon-button" type="button" aria-label="เปลี่ยนธีม"><span aria-hidden="true">◐</span></button>
        </div>
      </header>
      <main id="main-content" class="main-content" tabindex="-1"></main>
      <footer class="site-footer">
        <p><strong>Local-first:</strong> เครื่องมือ Client-side ประมวลผลข้อมูลภายในอุปกรณ์ของคุณ</p>
        <nav aria-label="ลิงก์ท้ายเว็บไซต์"><a href="#/">เครื่องมือ</a><a href="https://github.com/aodxx/Personal-Utility-Hub/blob/main/docs/PRIVACY_AND_DEPENDENCIES.md" target="_blank" rel="noreferrer">ความเป็นส่วนตัว</a></nav>
      </footer>
    `;

    this.themeButton = this.root.querySelector<HTMLButtonElement>('#theme-toggle') ?? undefined;
    this.applyTheme(this.getInitialTheme());
    this.themeButton?.addEventListener('click', this.handleThemeToggle);

    const installButton = this.root.querySelector<HTMLButtonElement>('#install-app');
    if (installButton) this.pwa.start(installButton);

    this.router.start((route) => void this.renderRoute(route));
  }

  stop(): void {
    this.cleanupHome?.();
    this.cleanupHome = undefined;
    this.themeButton?.removeEventListener('click', this.handleThemeToggle);
    this.themeButton = undefined;
    this.pwa.stop();
    this.router.stop();
    void this.toolLoader.clear();
  }

  private readonly handleThemeToggle = (): void => {
    const nextTheme: ThemePreference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    this.preferences.setTheme(nextTheme);
    this.applyTheme(nextTheme);
  };

  private async renderRoute(route: AppRoute): Promise<void> {
    const navigationId = ++this.navigationId;
    const main = this.getMain();
    this.cleanupHome?.();
    this.cleanupHome = undefined;

    if (route.kind !== 'tool') await this.toolLoader.clear();
    if (navigationId !== this.navigationId) return;

    if (route.kind === 'home') {
      this.renderHome(main);
      return;
    }

    if (route.kind === 'not-found') {
      this.renderNotFound(main, route.path);
      return;
    }

    const entry = toolRegistry.find(({ metadata }) => metadata.id === route.toolId);
    if (!entry) {
      this.renderNotFound(main, route.toolId);
      return;
    }

    const tool = entry.metadata;
    this.preferences.addRecent(tool.id);
    main.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">← กลับหน้า Hub</a></nav>
      <section class="tool-heading">
        <div class="tool-heading__meta"><span class="eyebrow">${this.escapeHtml(tool.category)}</span>${this.statusBadge(tool)}</div>
        <h1>${this.escapeHtml(tool.title)}</h1>
        <p>${this.escapeHtml(tool.description)}</p>
        <div class="privacy-note">
          <span aria-hidden="true">✓</span>
          <div><strong>ประมวลผลในเครื่อง</strong><small>ไม่อัปโหลดข้อมูลหรือไฟล์ของคุณไปยังเซิร์ฟเวอร์${tool.supportsOffline ? ' · รองรับการใช้งาน Offline' : ''}</small></div>
        </div>
      </section>
      <div id="tool-container" class="tool-container" aria-live="polite">
        <div class="loading-state"><span class="spinner" aria-hidden="true"></span>กำลังโหลด Module…</div>
      </div>
    `;

    const container = main.querySelector<HTMLElement>('#tool-container');
    if (!container) return;

    try {
      await this.toolLoader.load(route.toolId, container);
    } catch (error) {
      if (navigationId !== this.navigationId) return;
      if (error instanceof ToolNotFoundError) {
        this.renderNotFound(main, route.toolId);
        return;
      }
      container.innerHTML = `
        <section class="error-state" role="alert">
          <div class="error-state__icon" aria-hidden="true">!</div>
          <h2>โหลดเครื่องมือไม่สำเร็จ</h2>
          <p>${this.escapeHtml(getErrorMessage(error))}</p>
          <a class="button" href="#/">กลับหน้า Hub</a>
        </section>
      `;
    }
  }

  private renderHome(main: HTMLElement): void {
    let query = '';
    let activeCategory = 'ทั้งหมด';
    let favoritesOnly = false;

    main.innerHTML = `
      <section class="hero hero--hub">
        <div class="hero__copy">
          <div class="eyebrow">Private · Fast · Works offline</div>
          <h1>เครื่องมือที่ต้องใช้<br><span>รวมไว้ในที่เดียว</span></h1>
          <p>ค้นหา เปิดใช้ และบันทึกเครื่องมือโปรดได้ทันที ข้อมูลของคุณประมวลผลภายในเบราว์เซอร์โดยไม่ต้องสมัครสมาชิก</p>
        </div>
        <div class="hero__visual" aria-hidden="true">
          <span class="hero__orb hero__orb--one"></span>
          <span class="hero__orb hero__orb--two"></span>
          ${assetIcon('category-all', 'asset-icon--hero')}
        </div>
        <div class="search-panel" role="search">
          <label class="search-box" for="tool-search">
            <span aria-hidden="true">⌕</span>
            <input id="tool-search" type="search" placeholder="ค้นหา เช่น JSON, QR Code, รูปภาพ…" autocomplete="off" />
            <kbd>/</kbd>
          </label>
          <label class="favorite-filter"><input id="favorites-only" type="checkbox" /> เฉพาะรายการโปรด</label>
        </div>
      </section>

      <section class="trust-strip" aria-label="หลักการความเป็นส่วนตัว">
        <div><span aria-hidden="true">01</span><strong>ทำงานในเครื่อง</strong><small>ไฟล์ไม่ถูกอัปโหลด</small></div>
        <div><span aria-hidden="true">02</span><strong>ไม่ต้องมีบัญชี</strong><small>เปิดแล้วใช้งานได้ทันที</small></div>
        <div><span aria-hidden="true">03</span><strong>พร้อม Offline</strong><small>ติดตั้งเป็น PWA ได้</small></div>
      </section>

      <section class="section-block section-block--catalog" aria-labelledby="catalog-title">
        <div class="section-heading">
          <div><div class="eyebrow">Tool catalog</div><h2 id="catalog-title">เลือกเครื่องมือ</h2></div>
          <output id="result-count" class="result-count" aria-live="polite"></output>
        </div>
        <div id="category-tabs" class="category-tabs" role="group" aria-label="กรองตามหมวดหมู่">
          ${allCategories.map((category) => `<button class="category-tab" type="button" data-category="${this.escapeHtml(category)}" aria-pressed="${category === 'ทั้งหมด'}">${assetIcon(categoryVisuals[category], 'asset-icon--category')}<span>${this.escapeHtml(category)}</span></button>`).join('')}
        </div>
        <div id="tool-grid" class="tool-grid"></div>
      </section>

      <section id="favorites-section" class="section-block" aria-labelledby="favorites-title"></section>
      <section id="recent-section" class="section-block" aria-labelledby="recent-title"></section>
    `;

    const searchInput = main.querySelector<HTMLInputElement>('#tool-search');
    const favoritesCheckbox = main.querySelector<HTMLInputElement>('#favorites-only');
    const categoryTabs = main.querySelector<HTMLElement>('#category-tabs');

    const refresh = (): void => {
      const favorites = this.preferences.getFavorites();
      const filtered = filterTools(toolCatalog, { query, category: activeCategory, favorites, favoritesOnly });
      const grid = main.querySelector<HTMLElement>('#tool-grid');
      const count = main.querySelector<HTMLOutputElement>('#result-count');
      if (count) count.textContent = `${filtered.length} เครื่องมือ`;
      if (grid) {
        grid.innerHTML = filtered.length
          ? filtered.map((tool) => this.toolCard(tool, favorites)).join('')
          : this.emptyState('ไม่พบเครื่องมือที่ตรงกับการค้นหา', 'ลองเปลี่ยนคำค้น หมวดหมู่ หรือตัวกรองรายการโปรด');
      }
      this.renderFavorites(main, favorites);
      this.renderRecent(main, favorites);
    };

    const handleInput = (): void => {
      query = searchInput?.value ?? '';
      refresh();
    };
    const handleFavoritesFilter = (): void => {
      favoritesOnly = favoritesCheckbox?.checked ?? false;
      refresh();
    };
    const handleCategory = (event: Event): void => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-category]');
      if (!button) return;
      activeCategory = button.dataset.category ?? 'ทั้งหมด';
      categoryTabs?.querySelectorAll<HTMLButtonElement>('[data-category]').forEach((tab) => {
        tab.setAttribute('aria-pressed', String(tab === button));
      });
      refresh();
    };
    const handleActions = (event: Event): void => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'favorite' && target.dataset.id) {
        this.preferences.toggleFavorite(target.dataset.id);
        refresh();
      }
      if (action === 'clear-recent') {
        this.preferences.clearRecent();
        refresh();
      }
    };
    const handleShortcut = (event: KeyboardEvent): void => {
      if (event.key === '/' && document.activeElement !== searchInput) {
        event.preventDefault();
        searchInput?.focus();
      }
    };

    searchInput?.addEventListener('input', handleInput);
    favoritesCheckbox?.addEventListener('change', handleFavoritesFilter);
    categoryTabs?.addEventListener('click', handleCategory);
    main.addEventListener('click', handleActions);
    document.addEventListener('keydown', handleShortcut);
    this.cleanupHome = () => {
      searchInput?.removeEventListener('input', handleInput);
      favoritesCheckbox?.removeEventListener('change', handleFavoritesFilter);
      categoryTabs?.removeEventListener('click', handleCategory);
      main.removeEventListener('click', handleActions);
      document.removeEventListener('keydown', handleShortcut);
    };

    refresh();
  }

  private renderFavorites(main: HTMLElement, favorites: ReadonlySet<string>): void {
    const section = main.querySelector<HTMLElement>('#favorites-section');
    if (!section) return;
    const tools = toolCatalog.filter((tool) => favorites.has(tool.id));
    section.innerHTML = `
      <div class="section-heading"><div><div class="eyebrow">Saved locally</div><h2 id="favorites-title">รายการโปรด</h2></div><span class="result-count">${tools.length}</span></div>
      ${tools.length ? `<div class="tool-grid tool-grid--compact">${tools.map((tool) => this.toolCard(tool, favorites)).join('')}</div>` : this.emptyState('ยังไม่มีรายการโปรด', 'กดรูปดาวบน Tool Card เพื่อเก็บเครื่องมือไว้ในอุปกรณ์นี้')}
    `;
  }

  private renderRecent(main: HTMLElement, favorites: ReadonlySet<string>): void {
    const section = main.querySelector<HTMLElement>('#recent-section');
    if (!section) return;
    const recentIds = this.preferences.getRecent();
    const tools = recentIds.map((id) => toolCatalog.find((tool) => tool.id === id)).filter((tool): tool is ToolMetadata => Boolean(tool));
    section.innerHTML = `
      <div class="section-heading">
        <div><div class="eyebrow">On this device</div><h2 id="recent-title">เปิดล่าสุด</h2></div>
        ${tools.length ? '<button class="text-button" type="button" data-action="clear-recent">ล้างประวัติ</button>' : ''}
      </div>
      ${tools.length ? `<div class="tool-grid tool-grid--compact">${tools.map((tool) => this.toolCard(tool, favorites)).join('')}</div>` : this.emptyState('ยังไม่มีประวัติ', 'เครื่องมือที่คุณเปิดจะปรากฏตรงนี้โดยเก็บเฉพาะในอุปกรณ์')}
    `;
  }

  private toolCard(tool: ToolMetadata, favorites: ReadonlySet<string>): string {
    const isFavorite = favorites.has(tool.id);
    return `
      <article class="tool-card" data-tool-id="${tool.id}">
        <div class="tool-card__top">
          <span class="tool-card__visual">${toolAssetIcon(tool.icon)}</span>
          <button class="favorite-button" type="button" data-action="favorite" data-id="${tool.id}" aria-label="${isFavorite ? 'นำออกจาก' : 'เพิ่มใน'}รายการโปรด: ${this.escapeHtml(tool.title)}" aria-pressed="${isFavorite}"><span aria-hidden="true">${isFavorite ? '★' : '☆'}</span></button>
        </div>
        <div class="tool-card__body">
          <div class="tool-card__meta"><span>${this.escapeHtml(tool.category)}</span>${this.statusBadge(tool)}</div>
          <h3><a href="#${tool.route}">${this.escapeHtml(tool.title)}</a></h3>
          <p>${this.escapeHtml(tool.description)}</p>
        </div>
        <div class="tool-card__footer">
          <span class="privacy-badge">✓ ในเครื่อง</span>
          ${tool.supportsOffline ? '<span class="offline-badge">Offline</span>' : ''}
          <a class="tool-card__link" href="#${tool.route}" aria-label="เปิด ${this.escapeHtml(tool.title)}">เปิด <span aria-hidden="true">→</span></a>
        </div>
      </article>
    `;
  }

  private statusBadge(tool: ToolMetadata): string {
    if (tool.status === 'planned') return '<span class="planned-pill">เร็ว ๆ นี้</span>';
    if (tool.status === 'beta') return '<span class="beta-pill">BETA</span>';
    return '';
  }

  private emptyState(title: string, description: string): string {
    return `<div class="empty-state"><span aria-hidden="true">◇</span><div><strong>${title}</strong><p>${description}</p></div></div>`;
  }

  private renderNotFound(main: HTMLElement, path: string): void {
    main.innerHTML = `
      <section class="not-found">
        <div class="not-found__code">404</div>
        <div class="eyebrow">Route not found</div>
        <h1>ไม่พบหน้าที่คุณต้องการ</h1>
        <p>เส้นทาง “${this.escapeHtml(path)}” ไม่มีอยู่ใน Hub หรืออาจถูกย้ายแล้ว</p>
        <a class="button button--primary" href="#/">กลับหน้า Hub</a>
      </section>
    `;
  }

  private getInitialTheme(): ThemePreference {
    const saved = this.preferences.getTheme();
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemePreference): void {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (this.themeButton) {
      const nextLabel = theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด';
      this.themeButton.setAttribute('aria-label', nextLabel);
      const icon = this.themeButton.querySelector('span');
      if (icon) icon.textContent = theme === 'dark' ? '☀' : '◐';
    }
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#0d1526' : '#f5f7fb');
  }

  private getMain(): HTMLElement {
    const main = this.root.querySelector<HTMLElement>('#main-content');
    if (!main) throw new Error('ไม่พบพื้นที่เนื้อหาหลัก');
    return main;
  }

  private escapeHtml(value: string): string {
    const span = document.createElement('span');
    span.textContent = value;
    return span.innerHTML;
  }
}
