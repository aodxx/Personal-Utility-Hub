import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.SVG_LIBRARY_ROOT || process.cwd());
const assetDir = path.join(root, 'public/svg-assets');
const manifestPath = path.join(root, 'src/data/svg-assets/manifest.ts');
const reportPath = path.join(root, 'docs/svg-library-integrity-report.json');
const manifestSource = await readFile(manifestPath, 'utf8');
const manifestMatch = manifestSource.match(/export const svgAssetManifest: readonly SvgAssetMetadata\[\] = (\[[\s\S]*?\]);\s*\n\s*export const/);
if (!manifestMatch) throw new Error('Unable to parse svgAssetManifest');
const records = JSON.parse(manifestMatch[1]);
const files = (await readdir(assetDir)).filter((file) => file.endsWith('.svg')).sort();
const failures = [];
const warnings = [];
const required = ['id', 'title', 'keywords', 'category', 'style', 'source', 'author', 'license', 'licenseUrl', 'sourceUrl', 'attributionRequired', 'commercialUseAllowed', 'modifiedAllowed', 'assetUrl', 'filename', 'viewBox', 'reviewed', 'reviewedAt', 'semantic'];
const recordByFile = new Map(records.map((record) => [record.filename, record]));
const canonical = (text) => text
  .replace(/<title[\s\S]*?<\/title>/gi, '')
  .replace(/\s+xmlns="[^"]+"/gi, '')
  .replace(/\s+(?:width|height|role|aria-labelledby)="[^"]*"/gi, '')
  .replace(/\s+/g, ' ')
  .replace(/>\s+</g, '><')
  .trim();
const geometry = (text) => canonical(text)
  .replace(/\s+fill="[^"]*"/gi, '')
  .replace(/\s+stroke="[^"]*"/gi, '')
  .replace(/\s+stroke-width="[^"]*"/gi, '')
  .replace(/\s+stroke-linecap="[^"]*"/gi, '')
  .replace(/\s+stroke-linejoin="[^"]*"/gi, '');
const hash = (text) => createHash('sha256').update(text).digest('hex');
const duplicateGroups = (items, key) => {
  const groups = new Map();
  for (const item of items) { const value = key(item); if (!groups.has(value)) groups.set(value, []); groups.get(value).push(item.filename); }
  return [...groups.values()].filter((group) => group.length > 1);
};

if (files.length < 100) failures.push(`library has only ${files.length} SVG files; at least 100 required`);
if (new Set(files).size !== files.length) failures.push('duplicate SVG filenames detected');
if (records.length !== files.length) failures.push(`manifest count ${records.length} does not match asset count ${files.length}`);
for (const field of required) if (!manifestSource.includes(field)) failures.push(`manifest field missing: ${field}`);
const manifestFiles = new Set(records.map((record) => record.filename));
for (const file of files) if (!manifestFiles.has(file)) failures.push(`orphan asset not in manifest: ${file}`);
for (const record of records) {
  if (!record.filename || !recordByFile.has(record.filename)) failures.push(`manifest missing asset file: ${record.filename || record.id}`);
  if (record.assetUrl !== `./svg-assets/${record.filename}`) failures.push(`${record.filename}: broken assetUrl`);
  if (record.reviewed !== true || !/^\d{4}-\d{2}-\d{2}$/.test(record.reviewedAt || '')) failures.push(`${record.filename}: missing visual review record`);
  if (!record.semantic || record.semantic !== record.title) failures.push(`${record.filename}: semantic/title mismatch`);
  if (record.style === 'filled' && record.properties?.includes('monochrome') === false) warnings.push(`${record.filename}: filled style needs visual review`);
}

const inspected = [];
for (const file of files) {
  const text = await readFile(path.join(assetDir, file), 'utf8');
  const record = recordByFile.get(file);
  const title = text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || '';
  const viewBox = text.match(/viewBox="([^"]+)"/i)?.[1] || '';
  const unsafe = /<\s*(script|iframe|object|embed|applet|foreignObject)\b/i.test(text) || /\bon[a-z]+\s*=|javascript:|vbscript:|data:text\/html|(?:href|src)\s*=\s*["']https?:\/\//i.test(text);
  const styleMismatch = record?.style === 'filled' && /fill="none"/i.test(text);
  if (!/^\s*<svg\b/i.test(text) || !/<\/svg>\s*$/i.test(text)) failures.push(`${file}: invalid SVG root`);
  if (viewBox !== record?.viewBox) failures.push(`${file}: viewBox mismatch`);
  if (unsafe) failures.push(`${file}: unsafe markup`);
  if (!title) failures.push(`${file}: missing title`);
  if (record && title !== record.title) failures.push(`${file}: title mismatch (${title} vs ${record.title})`);
  if (styleMismatch) failures.push(`${file}: style metadata says filled but SVG is stroke-only`);
  inspected.push({ filename: file, id: record?.id, title, viewBox, bytes: Buffer.byteLength(text), exactHash: hash(canonical(text)), geometryHash: hash(geometry(text)), reviewed: record?.reviewed === true, semantic: record?.semantic, style: record?.style, category: record?.category });
}
const exactDuplicates = duplicateGroups(inspected, (item) => item.exactHash);
const geometryDuplicates = duplicateGroups(inspected, (item) => item.geometryHash);
for (const group of exactDuplicates) failures.push(`exact SVG duplicate: ${group.join(', ')}`);
for (const group of geometryDuplicates) failures.push(`geometry duplicate: ${group.join(', ')}`);
const nearDuplicates = [];
for (let index = 0; index < inspected.length; index += 1) {
  for (let other = index + 1; other < inspected.length; other += 1) {
    const left = inspected[index]; const right = inspected[other];
    if (left.category === right.category && left.geometryHash.slice(0, 10) === right.geometryHash.slice(0, 10) && left.geometryHash !== right.geometryHash) nearDuplicates.push([left.filename, right.filename]);
  }
}
for (const pair of nearDuplicates) warnings.push(`near duplicate review: ${pair.join(' ↔ ')}`);
const report = { generatedAt: new Date().toISOString(), assetCount: files.length, manifestCount: records.length, exactDuplicates, geometryDuplicates, nearDuplicates, failures, warnings, assets: inspected };
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
if (failures.length) { console.error(failures.join('\n')); console.error(`SVG library integrity FAILED; report: ${reportPath}`); process.exit(1); }
console.log(`SVG library integrity passed: ${files.length} assets, exact duplicates ${exactDuplicates.length}, geometry duplicates ${geometryDuplicates.length}, near-duplicate warnings ${nearDuplicates.length}`);
console.log(`Evidence report: ${reportPath}`);
