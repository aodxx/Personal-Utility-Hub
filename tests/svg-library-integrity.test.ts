import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checker = path.resolve('scripts/check-svg-library.mjs');
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><title>Duplicate</title><path d="M4 4h16v16H4z" /></svg>\n';
const record = (filename: string, id: string) => ({ id, title: id, keywords: [id, 'svg'], category: 'test', style: 'outline', properties: ['currentColor', 'monochrome'], source: `Original Utility Hub asset: public/svg-assets/${filename}`, author: 'Personal Utility Hub', license: 'Original — Utility Hub', licenseUrl: '/docs/svg-library-license-policy.md', sourceUrl: 'https://github.com/aodxx/Personal-Utility-Hub/tree/main/public/svg-assets', attributionRequired: false, commercialUseAllowed: true, modifiedAllowed: true, assetUrl: `./svg-assets/${filename}`, filename, viewBox: '0 0 24 24', reviewed: true, reviewedAt: '2026-08-17', semantic: id });

describe('SVG library integrity gate', () => {
  it('fails a temporary exact/geometry duplicate fixture', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'svg-library-bad-fixture-'));
    try {
      await mkdir(path.join(tempRoot, 'public/svg-assets'), { recursive: true });
      await mkdir(path.join(tempRoot, 'src/data/svg-assets'), { recursive: true });
      await mkdir(path.join(tempRoot, 'docs'), { recursive: true });
      await writeFile(path.join(tempRoot, 'public/svg-assets/camera.svg'), svg);
      await writeFile(path.join(tempRoot, 'public/svg-assets/archive.svg'), svg);
      const manifest = [record('camera.svg', 'camera'), record('archive.svg', 'archive')];
      await writeFile(path.join(tempRoot, 'src/data/svg-assets/manifest.ts'), `export const svgAssetManifest: readonly SvgAssetMetadata[] = ${JSON.stringify(manifest)};\nexport const svgAssetCount = 2;\n`);
      expect(() => execFileSync(process.execPath, [checker], { cwd: process.cwd(), env: { ...process.env, SVG_LIBRARY_ROOT: tempRoot }, encoding: 'utf8', stdio: 'pipe' })).toThrow(/duplicate/i);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
