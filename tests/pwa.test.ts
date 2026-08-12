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
});
