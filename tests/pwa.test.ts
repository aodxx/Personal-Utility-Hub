import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA assets', () => {
  const publicDir = resolve(process.cwd(), 'public');
  const manifest = JSON.parse(readFileSync(resolve(publicDir, 'manifest.webmanifest'), 'utf8')) as {
    name: string;
    start_url: string;
    display: string;
    icons: Array<{ src: string; sizes: string; type: string }>;
  };

  it('has an installable manifest baseline', () => {
    expect(manifest.name).toBe('Personal Utility Hub');
    expect(manifest.start_url).toBe('./#/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
    ]));
  });

  it('references existing icons and includes offline assets', () => {
    for (const icon of manifest.icons) expect(existsSync(resolve(publicDir, icon.src))).toBe(true);
    expect(existsSync(resolve(publicDir, 'offline.html'))).toBe(true);
    expect(existsSync(resolve(publicDir, 'sw.js'))).toBe(true);
  });

  it('supports versioned shell and per-tool offline caches', () => {
    const serviceWorker = readFileSync(resolve(publicDir, 'sw.js'), 'utf8');
    expect(serviceWorker).toContain('utility-hub-shell-v0.7.0-product-expansion');
    expect(serviceWorker).toContain('utility-hub-tools-v0.7.0-product-expansion');
    expect(serviceWorker).toContain("event.data?.type !== 'CACHE_TOOL'");
    expect(serviceWorker).toContain('cache.addAll(urls)');
    expect(serviceWorker).toContain("const APP_SHELL_URL = new URL('index.html', APP_SCOPE).href");
    expect(serviceWorker.indexOf('caches.match(APP_SHELL_URL)')).toBeLessThan(serviceWorker.indexOf('caches.match(APP_SCOPE)'));
    expect(serviceWorker).toContain('caches.match(request, { ignoreVary: true })');
    expect(serviceWorker).toContain('await cache.put(request, response.clone())');
  });
});
