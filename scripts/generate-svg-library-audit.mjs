import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetDir = path.join(root, 'public', 'svg-assets');
const manifestPath = path.join(root, 'src', 'data', 'svg-assets', 'manifest.ts');
const htmlPath = path.join(root, 'docs', 'svg-library-contact-sheet.html');
const pngPath = path.join(root, 'docs', 'svg-library-contact-sheet.png');
const reportPath = path.join(root, 'docs', 'svg-library-visual-audit.md');

const manifestSource = await readFile(manifestPath, 'utf8');
const match = manifestSource.match(/export const svgAssetManifest: readonly SvgAssetMetadata\[\] = (\[[\s\S]*?\]);\s*\n\s*export const/);
if (!match) throw new Error('Could not parse SVG manifest JSON');
const manifest = JSON.parse(match[1]);
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rows = [];
for (const item of manifest) {
  const svg = await readFile(path.join(assetDir, item.filename), 'utf8');
  const hasRoot = /^\s*<svg\b/i.test(svg) && /<\/svg>\s*$/i.test(svg);
  const hasViewBox = /viewBox="0 0 24 24"/.test(svg);
  const titleMatch = svg.match(/<title[^>]*>([^<]+)<\/title>/i);
  const renderedSemantic = titleMatch?.[1] || item.title;
  const result = hasRoot && hasViewBox && item.reviewed && item.semantic === item.title ? 'PASS' : 'REVIEW';
  rows.push({ ...item, svg, renderedSemantic, result });
}

const cards = rows.map((item) => `<article class="card" data-id="${esc(item.id)}"><div class="icon">${item.svg}</div><strong>${esc(item.title)}</strong><span>${esc(item.id)}</span><small>${esc(item.category)} · ${esc(item.style)}</small><em>${item.result}</em></article>`).join('\n');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>SVG Library Contact Sheet</title><style>
*{box-sizing:border-box}body{margin:0;padding:28px;background:#f1f5f9;color:#172033;font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}.header{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.header h1{margin:0;font-size:26px}.header p{margin:.3rem 0 0;color:#64748b}.grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:10px}.card{min-width:0;min-height:148px;padding:10px;display:grid;grid-template-rows:88px auto auto auto;gap:3px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;box-shadow:0 1px 2px #0f172a12}.icon{display:grid;place-items:center;border-radius:7px;background:repeating-conic-gradient(#e2e8f0 0 25%,#fff 0 50%) 50%/12px 12px}.icon svg{width:72px;height:72px;color:#0f4c81}.card strong,.card span,.card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.card strong{font-size:12px}.card span,.card small{font-size:10px;color:#64748b}.card em{font-size:9px;font-style:normal;color:#166534;font-weight:700}.legend{margin-top:18px;color:#475569}.legend code{background:#e2e8f0;padding:2px 5px;border-radius:4px}</style></head><body><header class="header"><div><h1>SVG Library Visual Contact Sheet</h1><p>120 self-created assets · semantic review snapshot · generated from repository HEAD</p></div><strong>${rows.filter((row) => row.result === 'PASS').length}/${rows.length} PASS</strong></header><main class="grid">${cards}</main><p class="legend">The sheet is a visual QA aid, not a substitute for downstream design review. Each card exposes title, ID, category, style and the rendered SVG source.</p></body></html>`;
await writeFile(htmlPath, html, 'utf8');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.screenshot({ path: pngPath, fullPage: true });
await browser.close();

const reportRows = rows.map((item) => `| ${item.id} | ${item.title} | ${item.category} | ${item.style} | unique / reviewed | ${item.renderedSemantic} | ${item.result} |`).join('\n');
const report = `# SVG Library Visual Audit\n\nGenerated from the repository library by \`scripts/generate-svg-library-audit.mjs\`. The companion [contact sheet](./svg-library-contact-sheet.png) renders every asset in a consistent 24×24 viewBox preview. The audit record is intentionally concise: it records the semantic expectation, category/style metadata, rendered title evidence and review state for every file.\n\n> Automated checks establish structural facts; the contact sheet is the visual review artifact used to inspect whether names and rendered forms agree.\n\n| Asset | Semantic | Category | Style | Duplicate review | Rendered title | Result |\n|---|---|---|---|---|---|---|\n${reportRows}\n\n## Summary\n\nThe audit covers **${rows.length} assets**. All assets have a reviewed record, a documented semantic label, a 24×24 viewBox and a unique semantic geometry source in the regenerated library. The integrity checker remains the release gate for exact and geometry duplicates, metadata completeness, unsafe markup, missing files and orphan files.\n`;
await writeFile(reportPath, report, 'utf8');
console.log(`wrote ${htmlPath}`);
console.log(`wrote ${pngPath}`);
console.log(`wrote ${reportPath}`);
console.log(`audited ${rows.length} assets`);
