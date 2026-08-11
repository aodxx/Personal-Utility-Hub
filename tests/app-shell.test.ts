import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../src/app/app-shell';

describe('AppShell integration', () => {
  let app: AppShell | undefined;

  afterEach(() => {
    app?.stop();
    app = undefined;
    window.location.hash = '';
    document.body.replaceChildren();
  });

  it('renders home, lazy-loads the demo and returns home', async () => {
    window.location.hash = '#/';
    const root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
    app = new AppShell(root);
    app.start();

    await vi.waitFor(() => expect(root.textContent).toContain('เครื่องมือเล็ก ๆ'));

    window.location.hash = '#/tools/foundation-demo';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.textContent).toContain('Lifecycle พร้อมใช้งาน'));

    const button = root.querySelector<HTMLButtonElement>('button');
    button?.click();
    expect(root.textContent).toContain('Event listener ทำงาน 1 ครั้ง');

    window.location.hash = '#/';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await vi.waitFor(() => expect(root.textContent).toContain('Foundation ที่ตรวจสอบได้'));
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
