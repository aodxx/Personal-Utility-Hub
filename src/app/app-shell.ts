import { getErrorMessage, ToolNotFoundError } from '../core/errors';
import { ToolLoader } from '../core/tool-loader';
import { toolRegistry } from '../data/tools';
import { HashRouter } from './router';
import type { AppRoute } from './routes';

export class AppShell {
  private readonly router = new HashRouter();
  private readonly toolLoader = new ToolLoader(toolRegistry);
  private navigationId = 0;

  constructor(private readonly root: HTMLElement) {}

  start(): void {
    this.root.innerHTML = `
      <a class="skip-link" href="#main-content">ข้ามไปยังเนื้อหา</a>
      <header class="site-header">
        <a class="brand" href="#/" aria-label="Personal Utility Hub หน้าแรก">
          <span class="brand__mark" aria-hidden="true">U</span>
          <span><strong>Utility Hub</strong><small>Private by design</small></span>
        </a>
        <span class="phase-chip">Phase 0 · Foundation</span>
      </header>
      <main id="main-content" class="main-content" tabindex="-1"></main>
      <footer class="site-footer">
        <p>เครื่องมือ Client-side จะประมวลผลข้อมูลภายในอุปกรณ์ของคุณ</p>
        <p>Personal Utility Hub · Foundation v0.1.0</p>
      </footer>
    `;

    this.router.start((route) => void this.renderRoute(route));
  }

  stop(): void {
    this.router.stop();
    void this.toolLoader.clear();
  }

  private async renderRoute(route: AppRoute): Promise<void> {
    const navigationId = ++this.navigationId;
    const main = this.getMain();

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

    main.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">← กลับหน้า Hub</a></nav>
      <section class="tool-heading">
        <div class="eyebrow">${this.escapeHtml(entry.metadata.category)}</div>
        <h1>${this.escapeHtml(entry.metadata.title)}</h1>
        <p>${this.escapeHtml(entry.metadata.description)}</p>
        <div class="privacy-note"><span aria-hidden="true">✓</span><strong>ประมวลผลในเครื่อง</strong> Demo นี้ไม่ส่งข้อมูลออกจากอุปกรณ์</div>
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
    const demoEntry = toolRegistry.find(({ metadata }) => metadata.id === 'foundation-demo');
    if (!demoEntry) throw new Error('ไม่พบ Foundation Demo ใน Tool Registry');
    const demo = demoEntry.metadata;
    main.innerHTML = `
      <section class="hero">
        <div class="eyebrow">Static · Local-first · Modular</div>
        <h1>เครื่องมือเล็ก ๆ<br><span>ในพื้นที่ส่วนตัวของคุณ</span></h1>
        <p>Foundation ของศูนย์รวม Utility Web Tools พร้อมแล้วสำหรับการขยาย โดยไม่ต้องผูกกับ Backend หรือส่งไฟล์ผู้ใช้ออกนอกเบราว์เซอร์</p>
        <div class="hero__actions">
          <a class="button button--primary" href="#${demo.route}">เปิด Lifecycle Demo</a>
          <a class="button button--ghost" href="https://github.com/aodxx/Personal-Utility-Hub" target="_blank" rel="noreferrer">ดู Source Code</a>
        </div>
      </section>

      <section class="trust-strip" aria-label="หลักการความเป็นส่วนตัว">
        <div><span aria-hidden="true">01</span><strong>Client-side First</strong><small>ข้อมูลอยู่ในเบราว์เซอร์</small></div>
        <div><span aria-hidden="true">02</span><strong>No Account</strong><small>ไม่ต้องสมัครสมาชิก</small></div>
        <div><span aria-hidden="true">03</span><strong>Open Architecture</strong><small>เพิ่ม Tool ผ่าน Registry</small></div>
      </section>

      <section class="section-block" aria-labelledby="foundation-title">
        <div class="section-heading">
          <div><div class="eyebrow">Architecture proof</div><h2 id="foundation-title">Foundation ที่ตรวจสอบได้</h2></div>
          <span class="status-pill">Core foundation ready</span>
        </div>
        <div class="foundation-grid">
          ${this.foundationCard('Typed Registry', 'Metadata ถูกตรวจสอบก่อนแอปเริ่มทำงาน', 'TR')}
          ${this.foundationCard('Hash Router', 'เปิดและ Refresh ได้บน GitHub Pages', 'HR')}
          ${this.foundationCard('Lazy Loader', 'โหลด Module เมื่อผู้ใช้เปิดเท่านั้น', 'LL')}
          ${this.foundationCard('Safe Lifecycle', 'คืน Listener และ Resource ผ่าน unmount()', 'SL')}
        </div>
      </section>

      <section class="section-block" aria-labelledby="demo-title">
        <div class="section-heading"><div><div class="eyebrow">Internal tool</div><h2 id="demo-title">ทดสอบเส้นทางครบวงจร</h2></div></div>
        <article class="tool-card">
          <div class="tool-card__icon" aria-hidden="true">${demo.icon ?? '◈'}</div>
          <div class="tool-card__body">
            <div class="tool-card__meta"><span>${this.escapeHtml(demo.category)}</span><span class="beta-pill">BETA</span></div>
            <h3>${this.escapeHtml(demo.title)}</h3>
            <p>${this.escapeHtml(demo.description)}</p>
            <div class="badge-row"><span class="privacy-badge">✓ ประมวลผลในเครื่อง</span><span class="version-badge">v${demo.version}</span></div>
          </div>
          <a class="tool-card__link" href="#${demo.route}" aria-label="เปิด ${this.escapeHtml(demo.title)}">เปิด <span aria-hidden="true">→</span></a>
        </article>
      </section>
    `;
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

  private foundationCard(title: string, description: string, code: string): string {
    return `<article class="foundation-card"><span>${code}</span><h3>${title}</h3><p>${description}</p></article>`;
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
