import { detectCompatibility, requiredCompatibilityReady } from '../core/compatibility';
import { getErrorMessage, ToolLoadError, ToolNotFoundError } from '../core/errors';
import { localizeCategory, localizeTool, t, type AppLocale } from '../core/i18n';
import { PwaController } from '../core/pwa';
import { OfflineToolManager } from '../core/offline-tools';
import { filterTools } from '../core/search';
import { LocalPreferences, parsePortableSettings, type ThemePreference } from '../core/storage';
import { mostUsedTools, orderTools, type ToolOrder } from '../core/tool-order';
import type { ToolMetadata } from '../core/tool-contract';
import { ToolLoader } from '../core/tool-loader';
import { assetIcon, toolAssetIcon } from '../components/asset-icon';
import { allCategories } from '../data/categories';
import { publicToolCatalog, toolRegistry } from '../data/tools';
import { categoryVisuals } from '../data/visual-assets';
import { getToolGuide } from '../data/guides';
import { guideText } from '../core/tool-guide';
import { HashRouter } from './router';
import type { AppRoute } from './routes';

const MOST_USED_FALLBACK_IDS = ['image-compressor', 'pdf-merge', 'qr-generator', 'json-formatter', 'audio-trimmer'] as const;

export class AppShell {
  private readonly router = new HashRouter();
  private readonly toolLoader = new ToolLoader(toolRegistry);
  private readonly preferences = new LocalPreferences();
  private readonly pwa = new PwaController();
  private readonly offlineTools = new OfflineToolManager(toolRegistry);
  private navigationId = 0;
  private cleanupHome: (() => void) | undefined;
  private cleanupGuidance: (() => void) | undefined;
  private themeButton: HTMLButtonElement | undefined;
  private settingsButton: HTMLButtonElement | undefined;

  constructor(private readonly root: HTMLElement) {}

  start(): void {
    const locale = this.preferences.getLocale();
    document.documentElement.lang = locale;
    this.root.innerHTML = `
      <a class="skip-link" href="#main-content">${t(locale, 'skip')}</a>
      <header class="site-header">
        <a class="brand" href="#/" aria-label="${t(locale, 'home')}">
          <span class="brand__mark" aria-hidden="true">U</span>
          <span><strong>Utility Hub</strong><small>Private by design</small></span>
        </a>
        <div class="header-actions">
          <button id="install-app" class="icon-button icon-button--install" type="button" aria-label="${t(locale, 'installLabel')}">${t(locale, 'install')}</button>
          <button id="settings-toggle" class="icon-button" type="button" aria-label="${t(locale, 'settings')}"><span aria-hidden="true">⚙</span></button>
          <button id="theme-toggle" class="icon-button" type="button" aria-label="เปลี่ยนธีม"><span aria-hidden="true">◐</span></button>
        </div>
      </header>
      <main id="main-content" class="main-content" tabindex="-1"></main>
      <footer class="site-footer">
        <div class="site-footer__brand">
          <p><strong>Local-first:</strong> ${t(locale, 'footer')}</p>
          <span class="developer-credit"><span class="developer-credit__label">Developed by <strong>aod</strong></span><a class="developer-credit__social" href="https://www.facebook.com/share/1AWvhjdr44/" target="_blank" rel="noopener noreferrer" aria-label="เปิด Facebook ของ aod"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8h3.4Z"/></svg><span class="visually-hidden">Facebook</span></a></span>
        </div>
        <nav aria-label="${t(locale, 'footerNav')}"><a href="#/">${t(locale, 'tools')}</a><a href="#/privacy">${t(locale, 'privacy')}</a><a href="https://github.com/aodxx/Personal-Utility-Hub/blob/main/docs/PRIVACY_AND_DEPENDENCIES.md" target="_blank" rel="noreferrer">Source policy</a></nav>
      </footer>
      ${this.settingsDialog(locale)}
    `;

    this.themeButton = this.root.querySelector<HTMLButtonElement>('#theme-toggle') ?? undefined;
    this.applyTheme(this.getInitialTheme());
    this.themeButton?.addEventListener('click', this.handleThemeToggle);
    this.settingsButton = this.root.querySelector<HTMLButtonElement>('#settings-toggle') ?? undefined;
    this.settingsButton?.addEventListener('click', this.handleSettingsOpen);
    this.bindSettings();

    const installButton = this.root.querySelector<HTMLButtonElement>('#install-app');
    if (installButton) this.pwa.start(installButton);

    this.router.start((route) => void this.renderRoute(route));
  }

  stop(): void {
    this.cleanupHome?.();
    this.cleanupHome = undefined;
    this.cleanupGuidance?.();
    this.cleanupGuidance = undefined;
    this.themeButton?.removeEventListener('click', this.handleThemeToggle);
    this.themeButton = undefined;
    this.settingsButton?.removeEventListener('click', this.handleSettingsOpen);
    this.settingsButton = undefined;
    this.pwa.stop();
    this.router.stop();
    void this.toolLoader.clear();
  }

  private readonly handleThemeToggle = (): void => {
    const nextTheme: ThemePreference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    this.preferences.setTheme(nextTheme);
    this.applyTheme(nextTheme);
  };

  private readonly handleSettingsOpen = (): void => {
    const dialog = this.root.querySelector<HTMLDialogElement>('#settings-dialog');
    if (!dialog) return;
    this.renderCompatibility(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  private restart(): void {
    this.stop();
    this.start();
  }

  private settingsDialog(locale: AppLocale): string {
    const order = this.preferences.getToolOrder();
    return `
      <dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title">
        <div class="settings-dialog__header">
          <div><div class="eyebrow">Phase 5 · Local preferences</div><h2 id="settings-title">${t(locale, 'settingsTitle')}</h2></div>
          <button class="icon-button" type="button" data-settings-action="close" aria-label="${t(locale, 'close')}">×</button>
        </div>
        <p class="settings-dialog__intro">${t(locale, 'settingsIntro')}</p>
        <div class="settings-grid">
          <label class="field"><span>${t(locale, 'language')}</span><select id="settings-locale">
            <option value="th"${locale === 'th' ? ' selected' : ''}>ไทย</option>
            <option value="en"${locale === 'en' ? ' selected' : ''}>English</option>
          </select></label>
          <label class="field"><span>${t(locale, 'order')}</span><select id="settings-order">
            <option value="catalog"${order === 'catalog' ? ' selected' : ''}>${t(locale, 'orderCatalog')}</option>
            <option value="frequent"${order === 'frequent' ? ' selected' : ''}>${t(locale, 'orderFrequent')}</option>
          </select></label>
        </div>
        <section class="compatibility-panel" aria-labelledby="compatibility-title">
          <div class="compatibility-panel__heading"><div><div class="eyebrow">Browser</div><h3 id="compatibility-title">${t(locale, 'compatibility')}</h3></div><span id="compatibility-summary" class="compatibility-summary"></span></div>
          <ul id="compatibility-list" class="compatibility-list"></ul>
        </section>
        <section class="backend-decision"><strong>${t(locale, 'backendDecision')}</strong><p>${t(locale, 'backendReason')}</p></section>
        <div class="settings-transfer">
          <button class="button" type="button" data-settings-action="export">${t(locale, 'exportSettings')}</button>
          <button class="button" type="button" data-settings-action="import">${t(locale, 'importSettings')}</button>
          <input id="settings-file" class="visually-hidden" type="file" accept="application/json,.json" />
        </div>
        <p class="helper-text">${t(locale, 'importHint')}</p>
        <section class="settings-reset" aria-labelledby="reset-usage-title"><h3 id="reset-usage-title">${t(locale, 'resetUsage')}</h3><p>${t(locale, 'resetUsageDetail')}</p><button class="button" type="button" data-settings-action="clear-usage">${t(locale, 'resetUsage')}</button></section>
        <output id="settings-status" class="tool-status" aria-live="polite">${t(locale, 'compatibilitySummary')}</output>
      </dialog>
    `;
  }

  private bindSettings(): void {
    const dialog = this.root.querySelector<HTMLDialogElement>('#settings-dialog');
    const localeSelect = this.root.querySelector<HTMLSelectElement>('#settings-locale');
    const orderSelect = this.root.querySelector<HTMLSelectElement>('#settings-order');
    const fileInput = this.root.querySelector<HTMLInputElement>('#settings-file');
    if (!dialog) return;

    localeSelect?.addEventListener('change', () => {
      const locale: AppLocale = localeSelect.value === 'en' ? 'en' : 'th';
      this.preferences.setLocale(locale);
      this.restart();
    });
    orderSelect?.addEventListener('change', () => {
      const order: ToolOrder = orderSelect.value === 'frequent' ? 'frequent' : 'catalog';
      this.preferences.setToolOrder(order);
      this.restart();
    });
    dialog.addEventListener('click', (event) => {
      const action = (event.target as HTMLElement).closest<HTMLElement>('[data-settings-action]')?.dataset.settingsAction;
      if (action === 'close') {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
      if (action === 'export') this.exportSettings(dialog);
      if (action === 'import') fileInput?.click();
      if (action === 'clear-usage') {
        this.preferences.clearUsage();
        this.restart();
        const status = this.root.querySelector<HTMLOutputElement>('#settings-status');
        if (status) { status.dataset.tone = 'success'; status.textContent = t(this.preferences.getLocale(), 'resetUsageDone'); }
      }
    });
    fileInput?.addEventListener('change', () => void this.importSettings(dialog, fileInput));
  }

  private renderCompatibility(dialog: HTMLDialogElement): void {
    const locale = this.preferences.getLocale();
    const items = detectCompatibility();
    const list = dialog.querySelector<HTMLUListElement>('#compatibility-list');
    const summary = dialog.querySelector<HTMLElement>('#compatibility-summary');
    if (list) list.innerHTML = items.map((item) => `
      <li data-supported="${item.supported}"><span aria-hidden="true">${item.supported ? '✓' : '!'}</span><strong>${item.label}</strong><small>${t(locale, item.level)} · ${t(locale, item.supported ? 'compatible' : 'limited')}</small></li>
    `).join('');
    if (summary) {
      const ready = requiredCompatibilityReady(items);
      summary.dataset.ready = String(ready);
      summary.textContent = t(locale, ready ? 'compatible' : 'limited');
    }
  }

  private exportSettings(dialog: HTMLDialogElement): void {
    const locale = this.preferences.getLocale();
    const payload = JSON.stringify(this.preferences.exportSettings(), null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `utility-hub-settings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    const status = dialog.querySelector<HTMLOutputElement>('#settings-status');
    if (status) { status.dataset.tone = 'success'; status.textContent = t(locale, 'exportDone'); }
  }

  private async importSettings(dialog: HTMLDialogElement, input: HTMLInputElement): Promise<void> {
    const locale = this.preferences.getLocale();
    const status = dialog.querySelector<HTMLOutputElement>('#settings-status');
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new TypeError('ไฟล์การตั้งค่าต้องไม่เกิน 256 KB');
      const allowed = new Set(publicToolCatalog.map(({ id }) => id));
      const settings = parsePortableSettings(await file.text(), allowed);
      this.preferences.importSettings(settings);
      this.restart();
    } catch (error) {
      if (status) { status.dataset.tone = 'error'; status.textContent = `${t(locale, 'importFailed')}: ${getErrorMessage(error)}`; }
      input.value = '';
    }
  }

  private async renderRoute(route: AppRoute): Promise<void> {
    const navigationId = ++this.navigationId;
    const locale = this.preferences.getLocale();
    const main = this.getMain();
    this.cleanupHome?.();
    this.cleanupHome = undefined;

    if (route.kind !== 'tool') await this.toolLoader.clear();
    if (navigationId !== this.navigationId) return;

    if (route.kind === 'home') {
      this.renderHome(main);
      return;
    }

    if (route.kind === 'privacy') {
      this.renderPrivacy(main);
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

    const sourceTool = entry.metadata;
    const tool = localizeTool(sourceTool, locale);
    this.preferences.addRecent(sourceTool.id);
    this.preferences.recordUse(sourceTool.id);
    main.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">${t(locale, 'back')}</a></nav>
      <section class="tool-heading">
        <div class="tool-heading__meta"><span class="eyebrow">${this.escapeHtml(tool.category)}</span>${this.statusBadge(tool)}</div>
        <h1>${this.escapeHtml(tool.title)}</h1>
        <p>${this.escapeHtml(tool.description)}</p>
        <div class="privacy-note">
          <span aria-hidden="true">✓</span>
          <div><strong>${t(locale, 'localProcessing')}</strong><small>${t(locale, 'localDetail')}${tool.supportsOffline ? t(locale, 'offlineSuffix') : ''}</small></div>
          <a href="#/privacy" class="privacy-note__link">${t(locale, 'privacyGuide')}</a>
        </div>
        <div class="tool-heading__actions">
          <button class="button button--secondary" type="button" data-guidance-action="open">? ${t(locale, 'howToUse')}</button>
        </div>
      </section>
      ${this.firstUseHint(tool.id, locale)}
      <div id="tool-container" class="tool-container" aria-live="polite">
        <div class="loading-state"><span class="spinner" aria-hidden="true"></span>${t(locale, 'loading')}</div>
      </div>
      ${this.guideDialog(tool.id, locale)}
    `;

    this.bindGuidance(main, tool.id);
    const container = main.querySelector<HTMLElement>('#tool-container');
    if (!container) return;

    try {
      await this.toolLoader.load(route.toolId, container);
    } catch (error) {
      if (error instanceof ToolLoadError && navigationId === this.navigationId) {
        container.innerHTML = `<div class="loading-state"><span class="spinner" aria-hidden="true"></span>${t(locale, 'loading')}</div>`;
        try {
          await this.toolLoader.load(route.toolId, container);
          return;
        } catch (retryError) {
          error = retryError;
        }
      }
      if (navigationId !== this.navigationId) return;
      if (error instanceof ToolNotFoundError) {
        this.renderNotFound(main, route.toolId);
        return;
      }
      container.innerHTML = `
        <section class="error-state" role="alert">
          <div class="error-state__icon" aria-hidden="true">!</div>
          <h2>${t(locale, 'loadFailed')}</h2>
          <p>${this.escapeHtml(getErrorMessage(error))}</p>
          <a class="button" href="#/">${t(locale, 'back')}</a>
        </section>
      `;
    }
  }

  private renderPrivacy(main: HTMLElement): void {
    const locale = this.preferences.getLocale();
    main.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">${t(locale, 'back')}</a></nav>
      <section class="privacy-page" aria-labelledby="privacy-page-title">
        <div class="eyebrow">Trust & Security</div>
        <h1 id="privacy-page-title">${t(locale, 'privacyPageTitle')}</h1>
        <p class="privacy-page__intro">${t(locale, 'privacyPageIntro')}</p>
        <div class="privacy-flow" aria-label="${t(locale, 'privacyPageTitle')}">
          <div><strong>${t(locale, 'privacyFlowFile')}</strong><span>↓</span></div>
          <div><strong>${t(locale, 'privacyFlowBrowser')}</strong><span>↓</span></div>
          <div><strong>${t(locale, 'privacyFlowTool')}</strong><span>↓</span></div>
          <div><strong>${t(locale, 'privacyFlowResult')}</strong><span>↓</span></div>
          <div><strong>${t(locale, 'privacyFlowDownload')}</strong></div>
        </div>
        <div class="privacy-page__grid">
          <section class="privacy-page__section"><h2>${t(locale, 'privacyWhatWeDo')}</h2><p>${t(locale, 'privacyWhatWeDoDetail')}</p></section>
          <section class="privacy-page__section"><h2>${t(locale, 'privacyWhatWeStore')}</h2><p>${t(locale, 'privacyWhatWeStoreDetail')}</p></section>
          <section class="privacy-page__section privacy-page__section--caution"><h2>${t(locale, 'privacyDoNotPromise')}</h2><p>${t(locale, 'privacyDoNotPromiseDetail')}</p></section>
        </div>
        <a class="button" href="https://github.com/aodxx/Personal-Utility-Hub" target="_blank" rel="noreferrer">${t(locale, 'privacySource')}</a>
      </section>
    `;
  }

  private firstUseHint(toolId: string, locale: AppLocale): string {
    if (this.preferences.hasSeenGuide(toolId)) return '';
    return `<aside class="first-use-hint" data-first-use="${this.escapeHtml(toolId)}" aria-label="${t(locale, 'firstUseTitle')}">
      <div><strong>${t(locale, 'firstUseTitle')}</strong><p>${t(locale, 'firstUseDetail')}</p></div>
      <div class="first-use-hint__actions"><button class="button" type="button" data-guidance-action="open">${t(locale, 'firstUseRead')}</button><button class="text-button" type="button" data-guidance-action="dismiss">${t(locale, 'firstUseDismiss')}</button></div>
    </aside>`;
  }

  private guideDialog(toolId: string, locale: AppLocale): string {
    const guide = getToolGuide(toolId);
    if (!guide) return '';
    const list = (items: { th: string; en: string }[], className = '') => `<ul class="guide-list ${className}">${items.map((item) => `<li>${this.escapeHtml(guideText(item, locale))}</li>`).join('')}</ul>`;
    return `<dialog id="tool-guide-dialog" class="tool-guide-dialog" aria-labelledby="tool-guide-title">
      <div class="tool-guide-dialog__header"><div><div class="eyebrow">${t(locale, 'privacyGuide')}</div><h2 id="tool-guide-title">${t(locale, 'howToUse')}</h2></div><button class="icon-button" type="button" data-guidance-action="close" aria-label="${t(locale, 'guideClose')}">×</button></div>
      <div class="tool-guide-dialog__body">
        <section><h3>${t(locale, 'guideOverview')}</h3><p>${this.escapeHtml(guideText(guide.overview, locale))}</p></section>
        <section><h3>${t(locale, 'guideUseCases')}</h3>${list(guide.useCases)}</section>
        <div class="guide-two-column"><section><h3>${t(locale, 'guideInputs')}</h3><p>${this.escapeHtml(guideText(guide.supportedInputs, locale))}</p></section><section><h3>${t(locale, 'guideOutputs')}</h3><p>${this.escapeHtml(guideText(guide.outputs, locale))}</p></section></div>
        <section><h3>${t(locale, 'guideSteps')}</h3>${list(guide.steps, 'guide-list--numbered')}</section>
        <section><h3>${t(locale, 'guideLimitations')}</h3>${list(guide.limitations)}</section>
        <section><h3>${t(locale, 'guidePrivacy')}</h3><p>${this.escapeHtml(guideText(guide.privacy, locale))}</p></section>
        <section><h3>${t(locale, 'guideFaq')}</h3><div class="guide-faq">${guide.faq.map((item) => `<details><summary>${this.escapeHtml(guideText(item.question, locale))}</summary><p>${this.escapeHtml(guideText(item.answer, locale))}</p></details>`).join('')}</div></section>
        ${guide.tips.length ? `<section><h3>${t(locale, 'guideTips')}</h3>${list(guide.tips)}</section>` : ''}
      </div>
    </dialog>`;
  }

  private bindGuidance(main: HTMLElement, toolId: string): void {
    const dialog = main.querySelector<HTMLDialogElement>('#tool-guide-dialog');
    if (!dialog) return;
    const open = (): void => {
      this.preferences.markGuideSeen(toolId);
      main.querySelector<HTMLElement>('[data-first-use]')?.remove();
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.querySelector<HTMLButtonElement>('[data-guidance-action="close"]')?.focus();
    };
    const close = (): void => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };
    const handleClick = (event: Event): void => {
      const action = (event.target as HTMLElement).closest<HTMLElement>('[data-guidance-action]')?.dataset.guidanceAction;
      if (action === 'open') open();
      if (action === 'dismiss') {
        this.preferences.markGuideSeen(toolId);
        main.querySelector<HTMLElement>('[data-first-use]')?.remove();
      }
      if (action === 'close') close();
    };
    const handleKeydown = (event: KeyboardEvent): void => { if (event.key === 'Escape' && dialog.open) close(); };
    main.addEventListener('click', handleClick);
    main.addEventListener('keydown', handleKeydown);
    this.cleanupGuidance = () => {
      main.removeEventListener('click', handleClick);
      main.removeEventListener('keydown', handleKeydown);
    };
  }

  private renderHome(main: HTMLElement): void {
    const locale = this.preferences.getLocale();
    let query = '';
    let activeCategory = 'ทั้งหมด';
    let favoritesOnly = false;

    main.innerHTML = `
      <section class="hero hero--hub">
        <div class="hero__copy">
          <div class="eyebrow">Private · Fast · Works offline</div>
          <h1>${t(locale, 'heroTitle')}<br><span>${t(locale, 'heroAccent')}</span></h1>
          <p>${t(locale, 'heroDescription')}</p>
        </div>
        <div class="hero__visual" aria-hidden="true">
          <span class="hero__orb hero__orb--one"></span>
          <span class="hero__orb hero__orb--two"></span>
          ${assetIcon('category-all', 'asset-icon--hero')}
        </div>
        <div class="search-panel" role="search">
          <label class="search-box" for="tool-search">
            <span aria-hidden="true">⌕</span>
            <input id="tool-search" type="search" placeholder="${t(locale, 'searchPlaceholder')}" autocomplete="off" />
            <kbd>/</kbd>
          </label>
          <label class="favorite-filter"><input id="favorites-only" type="checkbox" /> ${t(locale, 'favoritesOnly')}</label>
        </div>
      </section>

      <section class="trust-chips" aria-label="${t(locale, 'trustLabel')}">
        <div class="trust-chips__list" role="list">
          <button class="trust-chip" type="button" data-trust-key="onDevice" aria-expanded="false" aria-describedby="trust-chip-detail"><span aria-hidden="true">✓</span>${t(locale, 'trustOnDevice')}</button>
          <button class="trust-chip" type="button" data-trust-key="noAccount" aria-expanded="false" aria-describedby="trust-chip-detail">${t(locale, 'trustNoAccount')}</button>
          <button class="trust-chip" type="button" data-trust-key="offline" aria-expanded="false" aria-describedby="trust-chip-detail">${t(locale, 'trustOffline')}</button>
        </div>
        <p id="trust-chip-detail" class="trust-chip__detail" role="status">${t(locale, 'trustChipHint')}</p>
      </section>

      <section class="section-block most-used" aria-labelledby="most-used-title">
        <div class="section-heading"><div><div class="eyebrow">${t(locale, 'mostUsedEyebrow')}</div><h2 id="most-used-title">${t(locale, 'mostUsedTitle')}</h2></div><span class="result-count">5</span></div>
        <p class="section-intro">${t(locale, 'mostUsedDetail')}</p>
        <div class="most-used-carousel-shell">
          <button class="carousel-control carousel-control--previous" type="button" data-carousel-action="previous" aria-label="${t(locale, 'carouselPrevious')}" disabled>←</button>
          <div id="most-used-carousel" class="most-used-carousel" role="region" aria-label="${t(locale, 'mostUsedTitle')}" tabindex="0"></div>
          <button class="carousel-control carousel-control--next" type="button" data-carousel-action="next" aria-label="${t(locale, 'carouselNext')}">→</button>
        </div>
        <div class="carousel-feedback"><div id="most-used-dots" class="carousel-dots" role="tablist" aria-label="${t(locale, 'carouselPosition')}"></div><span id="most-used-position" class="visually-hidden" role="status"></span></div>
        <p class="carousel-hint">${t(locale, 'carouselHint')}</p>
      </section>

      <section class="section-block section-block--catalog" aria-labelledby="catalog-title">
        <div class="section-heading">
          <div><div class="eyebrow">${t(locale, 'catalogLabel')}</div><h2 id="catalog-title">${t(locale, 'catalog')}</h2></div>
          <output id="result-count" class="result-count" aria-live="polite"></output>
        </div>
        <div id="category-tabs" class="category-tabs" role="group" aria-label="${t(locale, 'filterCategories')}">
          ${allCategories.map((category) => `<button class="category-tab" type="button" data-category="${this.escapeHtml(category)}" aria-pressed="${category === 'ทั้งหมด'}">${assetIcon(categoryVisuals[category], 'asset-icon--category')}<span>${this.escapeHtml(localizeCategory(category, locale))}</span></button>`).join('')}
        </div>
        <div id="tool-grid" class="tool-grid"></div>
        <output id="offline-status" class="visually-hidden" aria-live="polite"></output>
      </section>

      <section id="favorites-section" class="section-block" aria-labelledby="favorites-title"></section>
      <section id="recent-section" class="section-block" aria-labelledby="recent-title"></section>
      <output id="favorite-status" class="visually-hidden" aria-live="polite"></output>
    `;

    const searchInput = main.querySelector<HTMLInputElement>('#tool-search');
    const favoritesCheckbox = main.querySelector<HTMLInputElement>('#favorites-only');
    const categoryTabs = main.querySelector<HTMLElement>('#category-tabs');
    const trustChips = main.querySelector<HTMLElement>('.trust-chips');
    const mostUsedCarousel = main.querySelector<HTMLElement>('#most-used-carousel');
    let carouselFrame = 0;
    const handleCarouselClick = (event: Event): void => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-carousel-action], [data-carousel-index]');
      if (!target || !mostUsedCarousel) return;
      const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      if (target.dataset.carouselIndex) {
        const card = mostUsedCarousel.querySelector<HTMLElement>(`[data-carousel-card-index="${target.dataset.carouselIndex}"]`);
        if (card) mostUsedCarousel.scrollTo({ left: card.offsetLeft - 8, behavior });
        return;
      }
      const card = mostUsedCarousel.querySelector<HTMLElement>('.quick-tool-card');
      const amount = card ? card.getBoundingClientRect().width + 16 : mostUsedCarousel.clientWidth;
      mostUsedCarousel.scrollBy({ left: target.dataset.carouselAction === 'previous' ? -amount : amount, behavior });
    };
    const handleCarouselScroll = (): void => {
      if (carouselFrame) return;
      carouselFrame = window.requestAnimationFrame(() => { carouselFrame = 0; this.updateCarouselState(main); });
    };

    const refresh = (animatedFavoriteId?: string): void => {
      const favorites = this.preferences.getFavorites();
      const searchCatalog = publicToolCatalog.map((tool) => {
        const localized = localizeTool(tool, locale);
        return { ...localized, category: tool.category, tags: [...tool.tags, localized.category] };
      });
      const filtered = orderTools(
        filterTools(searchCatalog, { query, category: activeCategory, favorites, favoritesOnly }),
        this.preferences.getToolOrder(),
        this.preferences.getUsage(),
        publicToolCatalog.map(({ id }) => id),
      );
      const grid = main.querySelector<HTMLElement>('#tool-grid');
      const count = main.querySelector<HTMLOutputElement>('#result-count');
      if (count) count.textContent = `${filtered.length} ${t(locale, 'toolCount')}`;
      if (grid) {
        grid.innerHTML = filtered.length
          ? filtered.map((tool) => this.toolCard(tool, favorites, animatedFavoriteId)).join('')
          : this.emptyState(t(locale, 'noResults'), t(locale, 'noResultsDetail'));
      }
      this.renderMostUsed(main, favorites, animatedFavoriteId);
      this.renderFavorites(main, favorites, animatedFavoriteId);
      this.renderRecent(main, favorites, animatedFavoriteId);
      main.querySelectorAll<HTMLElement>('.favorite-button.is-bouncing').forEach((button) => {
        button.addEventListener('animationend', () => button.classList.remove('is-bouncing'), { once: true });
      });
      void this.refreshOfflineButtons(main);
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
    const trustExplanations: Record<string, string> = {
      onDevice: t(locale, 'trustOnDeviceDetail'),
      noAccount: t(locale, 'trustNoAccountDetail'),
      offline: t(locale, 'trustOfflineDetail'),
    };
    const activateTrustChip = (chip: HTMLButtonElement): void => {
      const key = chip.dataset.trustKey ?? '';
      const detail = main.querySelector<HTMLElement>('#trust-chip-detail');
      main.querySelectorAll<HTMLButtonElement>('.trust-chip').forEach((item) => item.setAttribute('aria-expanded', String(item === chip)));
      if (detail && trustExplanations[key]) detail.textContent = trustExplanations[key];
    };
    const handleTrustClick = (event: Event): void => {
      const chip = (event.target as HTMLElement).closest<HTMLButtonElement>('.trust-chip');
      if (chip) activateTrustChip(chip);
    };
    const handleTrustFocus = (event: FocusEvent): void => {
      const chip = event.target as HTMLButtonElement;
      if (chip.matches('.trust-chip')) activateTrustChip(chip);
    };
    const handleActions = (event: Event): void => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'favorite' && target.dataset.id) {
        const toolId = target.dataset.id;
        const isFavorite = this.preferences.toggleFavorite(toolId);
        refresh(toolId);
        const live = main.querySelector<HTMLOutputElement>('#favorite-status');
        const tool = publicToolCatalog.find(({ id }) => id === toolId);
        if (live && tool) {
          const title = localizeTool(tool, locale).title;
          live.textContent = `${t(locale, isFavorite ? 'addedFavorite' : 'removedFavorite')} ${title} ${t(locale, isFavorite ? 'favoriteTailAdd' : 'favoriteTailRemove')}`;
        }
      }
      if (action === 'clear-recent') {
        this.preferences.clearRecent();
        refresh();
      }
      if (action === 'offline' && target.dataset.id) {
        void this.prepareToolOffline(main, target.dataset.id, target as HTMLButtonElement);
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
    trustChips?.addEventListener('click', handleTrustClick);
    trustChips?.addEventListener('focusin', handleTrustFocus);
    mostUsedCarousel?.addEventListener('click', handleCarouselClick);
    mostUsedCarousel?.addEventListener('scroll', handleCarouselScroll, { passive: true });
    main.querySelector<HTMLElement>('.most-used-carousel-shell')?.addEventListener('click', handleCarouselClick);
    document.addEventListener('keydown', handleShortcut);
    this.cleanupHome = () => {
      searchInput?.removeEventListener('input', handleInput);
      favoritesCheckbox?.removeEventListener('change', handleFavoritesFilter);
      categoryTabs?.removeEventListener('click', handleCategory);
      main.removeEventListener('click', handleActions);
      trustChips?.removeEventListener('click', handleTrustClick);
      trustChips?.removeEventListener('focusin', handleTrustFocus);
      mostUsedCarousel?.removeEventListener('click', handleCarouselClick);
      mostUsedCarousel?.removeEventListener('scroll', handleCarouselScroll);
      main.querySelector<HTMLElement>('.most-used-carousel-shell')?.removeEventListener('click', handleCarouselClick);
      if (carouselFrame) window.cancelAnimationFrame(carouselFrame);
      document.removeEventListener('keydown', handleShortcut);
    };

    refresh();
  }

  private renderMostUsed(main: HTMLElement, favorites: ReadonlySet<string>, animatedFavoriteId?: string): void {
    const section = main.querySelector<HTMLElement>('#most-used-carousel');
    if (!section) return;
    const tools = mostUsedTools(publicToolCatalog, this.preferences.getUsage(), MOST_USED_FALLBACK_IDS, publicToolCatalog.map(({ id }) => id));
    section.innerHTML = tools.map((tool, index) => this.quickToolCard(tool, favorites, animatedFavoriteId, index)).join('');
    const dots = main.querySelector<HTMLElement>('#most-used-dots');
    if (dots) dots.innerHTML = tools.map((tool, index) => `<button class="carousel-dot${index === 0 ? ' is-active' : ''}" type="button" role="tab" data-carousel-index="${index}" aria-label="${t(this.preferences.getLocale(), 'carouselPosition')} ${index + 1}: ${this.escapeHtml(localizeTool(tool, this.preferences.getLocale()).title)}" aria-selected="${index === 0}"></button>`).join('');
    window.requestAnimationFrame(() => this.updateCarouselState(main));
  }

  private renderFavorites(main: HTMLElement, favorites: ReadonlySet<string>, animatedFavoriteId?: string): void {
    const locale = this.preferences.getLocale();
    const section = main.querySelector<HTMLElement>('#favorites-section');
    if (!section) return;
    const tools = publicToolCatalog.filter((tool) => favorites.has(tool.id));
    section.innerHTML = `
      <div class="section-heading"><div><div class="eyebrow">${t(locale, 'savedLocally')}</div><h2 id="favorites-title">${t(locale, 'favorites')}</h2></div><span class="result-count">${tools.length}</span></div>
      ${tools.length ? `<div class="tool-grid tool-grid--compact">${tools.map((tool) => this.toolCard(tool, favorites, animatedFavoriteId)).join('')}</div>` : this.emptyState(t(locale, 'noFavorites'), t(locale, 'noFavoritesDetail'))}
    `;
  }

  private renderRecent(main: HTMLElement, favorites: ReadonlySet<string>, animatedFavoriteId?: string): void {
    const locale = this.preferences.getLocale();
    const section = main.querySelector<HTMLElement>('#recent-section');
    if (!section) return;
    const recentIds = this.preferences.getRecent();
    const tools = recentIds.map((id) => publicToolCatalog.find((tool) => tool.id === id)).filter((tool): tool is ToolMetadata => Boolean(tool));
    section.innerHTML = `
      <div class="section-heading">
        <div><div class="eyebrow">${t(locale, 'onDevice')}</div><h2 id="recent-title">${t(locale, 'recent')}</h2></div>
        ${tools.length ? `<button class="text-button" type="button" data-action="clear-recent">${t(locale, 'clearHistory')}</button>` : ''}
      </div>
      ${tools.length ? `<div class="tool-grid tool-grid--compact">${tools.map((tool) => this.toolCard(tool, favorites, animatedFavoriteId)).join('')}</div>` : this.emptyState(t(locale, 'noRecent'), t(locale, 'noRecentDetail'))}
    `;
  }

  private updateCarouselState(main: HTMLElement): void {
    const carousel = main.querySelector<HTMLElement>('#most-used-carousel');
    if (!carousel) return;
    const cards = [...carousel.querySelectorAll<HTMLElement>('.quick-tool-card')];
    if (!cards.length) return;
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let activeIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < closestDistance) { closestDistance = distance; activeIndex = index; }
      card.classList.toggle('is-active', distance === closestDistance);
    });
    cards.forEach((card, index) => card.classList.toggle('is-active', index === activeIndex));
    main.querySelectorAll<HTMLButtonElement>('.carousel-dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
      dot.setAttribute('aria-selected', String(index === activeIndex));
    });
    const position = main.querySelector<HTMLElement>('#most-used-position');
    const locale = this.preferences.getLocale();
    if (position) position.textContent = `${t(locale, 'carouselActive')}: ${activeIndex + 1} / ${cards.length}`;
    const previous = main.querySelector<HTMLButtonElement>('[data-carousel-action="previous"]');
    const next = main.querySelector<HTMLButtonElement>('[data-carousel-action="next"]');
    if (previous) previous.disabled = carousel.scrollLeft <= 2;
    if (next) next.disabled = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;
  }

  private quickToolCard(tool: ToolMetadata, favorites: ReadonlySet<string>, animatedFavoriteId?: string, index = 0): string {
    const locale = this.preferences.getLocale();
    const displayed = localizeTool(tool, locale);
    const isFavorite = favorites.has(tool.id);
    const animationClass = animatedFavoriteId === tool.id ? ' is-bouncing' : '';
    return `<article class="quick-tool-card" data-tool-id="${tool.id}" data-carousel-card-index="${index}">
      <a class="quick-tool-card__tap-target" href="#${tool.route}" aria-label="${this.escapeHtml(displayed.title)}"></a>
      <div class="quick-tool-card__header"><span class="quick-tool-card__visual" aria-hidden="true">${toolAssetIcon(tool.icon, 'asset-icon--quick')}</span><button class="favorite-button favorite-button--compact${animationClass}" type="button" data-action="favorite" data-id="${tool.id}" aria-label="${t(locale, isFavorite ? 'removeFavorite' : 'addFavorite')}: ${this.escapeHtml(displayed.title)}" aria-pressed="${isFavorite}"><span aria-hidden="true">${isFavorite ? '★' : '☆'}</span></button></div>
      <div class="quick-tool-card__body"><span class="quick-tool-card__category">${this.escapeHtml(displayed.category)}</span><h3>${this.escapeHtml(displayed.title)}</h3><p>${this.escapeHtml(displayed.description)}</p></div>
      <div class="quick-tool-card__footer"><span class="privacy-badge">${t(locale, 'onDeviceBadge')}</span><span class="tool-card__arrow" aria-hidden="true">→</span></div>
    </article>`;
  }

  private toolCard(tool: ToolMetadata, favorites: ReadonlySet<string>, animatedFavoriteId?: string, extraClass = ''): string {
    const locale = this.preferences.getLocale();
    const displayed = localizeTool(tool, locale);
    const isFavorite = favorites.has(tool.id);
    const animationClass = animatedFavoriteId === tool.id ? ' is-bouncing' : '';
    return `
      <article class="tool-card ${extraClass}" data-tool-id="${tool.id}">
        <a class="tool-card__tap-target" href="#${tool.route}" aria-label="${this.escapeHtml(displayed.title)}"></a>
        <div class="tool-card__top">
          <span class="tool-card__visual">${toolAssetIcon(tool.icon)}</span>
        </div>
        <button class="favorite-button${animationClass}" type="button" data-action="favorite" data-id="${tool.id}" aria-label="${t(locale, isFavorite ? 'removeFavorite' : 'addFavorite')}: ${this.escapeHtml(displayed.title)}" aria-pressed="${isFavorite}"><span aria-hidden="true">${isFavorite ? '★' : '☆'}</span></button>
        <div class="tool-card__body">
          <div class="tool-card__meta"><span>${this.escapeHtml(displayed.category)}</span>${this.statusBadge(tool)}</div>
          <h3>${this.escapeHtml(displayed.title)}</h3>
          <p>${this.escapeHtml(displayed.description)}</p>
        </div>
        <div class="tool-card__footer">
          <a class="privacy-badge" href="#/privacy" aria-label="${t(locale, 'privacyExplain')}: ${this.escapeHtml(displayed.title)}" title="${t(locale, 'privacyExplain')}">${t(locale, 'onDeviceBadge')}</a>
          ${tool.supportsOffline ? `<button class="offline-cache-button" type="button" data-action="offline" data-id="${tool.id}" data-offline-state="not-ready" aria-label="${t(locale, 'prepareOffline')}: ${this.escapeHtml(displayed.title)}" title="${t(locale, 'offlineExplain')}">${t(locale, 'prepareOffline')}</button>` : ''}
          <span class="tool-card__arrow" aria-hidden="true">→</span>
        </div>
      </article>
    `;
  }

  private async refreshOfflineButtons(main: HTMLElement): Promise<void> {
    const locale = this.preferences.getLocale();
    const buttons = [...main.querySelectorAll<HTMLButtonElement>('[data-action="offline"][data-id]')];
    await Promise.all(buttons.map(async (button) => {
      const toolId = button.dataset.id;
      if (!toolId) return;
      const state = await this.offlineTools.getStatus(toolId);
      if (!button.isConnected) return;
      button.dataset.offlineState = state;
      button.textContent = t(locale, state === 'ready' ? 'offlineReady' : 'prepareOffline');
      button.setAttribute('aria-pressed', String(state === 'ready'));
    }));
  }

  private async prepareToolOffline(main: HTMLElement, toolId: string, button: HTMLButtonElement): Promise<void> {
    const locale = this.preferences.getLocale();
    if (button.dataset.offlineState === 'ready' || button.disabled) return;
    const live = main.querySelector<HTMLOutputElement>('#offline-status');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = t(locale, 'preparing');
    if (live) live.textContent = `กำลังเตรียม ${toolId} สำหรับใช้งาน Offline`;
    try {
      const cached = await this.offlineTools.prepare(toolId);
      button.dataset.offlineState = 'ready';
      button.setAttribute('aria-pressed', 'true');
      button.textContent = t(locale, 'offlineReady');
      if (live) live.textContent = `เตรียมเครื่องมือ Offline สำเร็จ เก็บทรัพยากร ${cached} รายการ`;
    } catch (error) {
      button.dataset.offlineState = 'not-ready';
      button.textContent = t(locale, 'retry');
      button.title = getErrorMessage(error);
      if (live) live.textContent = `เตรียม Offline ไม่สำเร็จ: ${getErrorMessage(error)}`;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      void this.refreshOfflineButtons(main);
    }
  }

  private statusBadge(tool: ToolMetadata): string {
    if (tool.status === 'planned') return `<span class="planned-pill">${t(this.preferences.getLocale(), 'planned')}</span>`;
    if (tool.status === 'beta') return '<span class="beta-pill">BETA</span>';
    return '';
  }

  private emptyState(title: string, description: string): string {
    return `<div class="empty-state"><span aria-hidden="true">◇</span><div><strong>${title}</strong><p>${description}</p></div></div>`;
  }

  private renderNotFound(main: HTMLElement, path: string): void {
    const locale = this.preferences.getLocale();
    main.innerHTML = `
      <section class="not-found">
        <div class="not-found__code">404</div>
        <div class="eyebrow">${t(locale, 'notFoundLabel')}</div>
        <h1>${t(locale, 'notFound')}</h1>
        <p>${t(locale, 'notFoundDetail')}: “${this.escapeHtml(path)}”</p>
        <a class="button button--primary" href="#/">${t(locale, 'back')}</a>
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
      const nextLabel = t(this.preferences.getLocale(), theme === 'dark' ? 'lightTheme' : 'darkTheme');
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
