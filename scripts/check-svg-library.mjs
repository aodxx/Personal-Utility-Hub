import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assetDir = path.join(root, 'public/svg-assets');
const manifest = await readFile(path.join(root, 'src/data/svg-assets/manifest.ts'), 'utf8');
const files = (await readdir(assetDir)).filter((file) => file.endsWith('.svg')).sort();
const failures = [];
const required = ['id', 'title', 'keywords', 'category', 'source', 'author', 'license', 'licenseUrl', 'sourceUrl', 'attributionRequired', 'commercialUseAllowed', 'modifiedAllowed'];
if (files.length < 100) failures.push(`library has only ${files.length} SVG files; at least 100 required`);
if (new Set(files).size !== files.length) failures.push('duplicate SVG filenames detected');
const manifestCount = (manifest.match(/"id":/g) || []).length;
if (manifestCount !== files.length) failures.push(`manifest count ${manifestCount} does not match asset count ${files.length}`);
for (const field of required) if (!manifest.includes(field)) failures.push(`manifest field missing: ${field}`);
for (const file of files) {
  const text = await readFile(path.join(assetDir, file), 'utf8');
  if (!/^\s*<svg\b/i.test(text) || !/<\/svg>\s*$/i.test(text)) failures.push(`${file}: invalid SVG root`);
  if (!/viewBox\s*=\s*"[^"]+"/i.test(text)) failures.push(`${file}: missing viewBox`);
  if (/<\s*(script|iframe|object|embed|foreignObject)\b/i.test(text) || /\bon[a-z]+\s*=|javascript:|(?:href|src)\s*=\s*["']https?:\/\//i.test(text)) failures.push(`${file}: unsafe markup`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`SVG library integrity passed: ${files.length} assets, ${Math.round((await Promise.all(files.map(async (file) => (await readFile(path.join(assetDir, file))).length))).reduce((a, b) => a + b, 0) / 1024)} KB raw SVG`);
