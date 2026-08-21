import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url);
const index = await readFile(new URL('index.html', DIST), 'utf8');
const entryMatch = index.match(/<script[^>]+src="([^"]+)"/);
if (!entryMatch?.[1]) throw new Error('ไม่พบ JavaScript entry ใน dist/index.html');

const assetsDir = new URL('assets/', DIST);
const files = await readdir(assetsDir);
const javaScript = files.filter((name) => name.endsWith('.js') || name.endsWith('.mjs'));
if (files.some((name) => name.endsWith('.ts'))) throw new Error('พบ TypeScript source ใน Production assets');
if (!javaScript.some((name) => /^processing\.worker-.*\.js$/.test(name))) throw new Error('ไม่พบ JavaScript processing worker bundle');
const reports = [];
for (const name of javaScript) {
  const path = join(assetsDir.pathname, name);
  const raw = (await stat(path)).size;
  const gzip = gzipSync(await readFile(path)).length;
  reports.push({ name, raw, gzip });
}

const entryName = entryMatch[1].split('/').pop();
const entry = reports.find(({ name }) => name === entryName);
if (!entry) throw new Error(`ไม่พบ entry chunk ${entryName}`);

const totalGzip = reports.reduce((sum, file) => sum + file.gzip, 0);
const largest = reports.reduce((current, file) => file.gzip > current.gzip ? file : current, reports[0]);
if (!largest) throw new Error('ไม่พบ JavaScript chunk');

const budgets = {
  // Two playable games add bilingual metadata and guide copy to the static entry; keep a narrow 50 KB budget.
  entryGzip: 50 * 1024,
  largestLazyGzip: 900 * 1024,
  totalJavaScriptGzip: 1_600 * 1024,
};

console.log(`Entry gzip: ${(entry.gzip / 1024).toFixed(1)} KB`);
console.log(`Largest lazy chunk: ${largest.name} ${(largest.gzip / 1024).toFixed(1)} KB`);
console.log(`All JavaScript gzip: ${(totalGzip / 1024).toFixed(1)} KB across ${reports.length} chunks`);

if (entry.gzip > budgets.entryGzip) throw new Error('Entry bundle เกินงบ 50 KB gzip');
if (largest.gzip > budgets.largestLazyGzip) throw new Error('Lazy chunk ที่ใหญ่ที่สุดเกินงบ 900 KB gzip');
if (totalGzip > budgets.totalJavaScriptGzip) throw new Error('JavaScript รวมเกินงบ 1,600 KB gzip');
