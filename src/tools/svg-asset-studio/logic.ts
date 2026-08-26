import type { SvgAssetMetadata } from '../../data/svg-assets/manifest';

export type SvgStatus = 'PASS' | 'WARNING' | 'FAIL';
export type OptimizePreset = 'safe' | 'balanced' | 'aggressive';
export type ColorMode = 'preserve' | 'single' | 'currentColor';

export interface SvgCheck { label: string; status: SvgStatus; detail: string; fix?: string; }
export interface SvgInspectorResult {
  status: SvgStatus;
  score: number;
  checks: SvgCheck[];
  viewBox: string;
  width: string;
  height: string;
  pathCount: number;
  groupCount: number;
  fills: string[];
  strokes: string[];
  strokeWidths: string[];
  currentColor: boolean;
  title: string;
  description: string;
  byteSize: number;
  embeddedStyle: boolean;
  scriptCount: number;
  externalReferenceCount: number;
  unsafeCount: number;
  hasFixedDimensions: boolean;
  accessible: boolean;
}

export interface SvgEditOptions {
  colorMode: ColorMode;
  color: string;
  stroke: string;
  strokeWidth: number;
  width: string;
  height: string;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  padding: number;
  background: string;
  opacity: number;
}

export interface ExportFile { name: string; bytes: Uint8Array; }
export interface SvgOptimizationResult {
  svg: string;
  beforeBytes: number;
  afterBytes: number;
  rawSavingsBytes: number;
  rawSavingsPercent: number;
  beforeGzipBytes?: number;
  afterGzipBytes?: number;
  gzipSavingsBytes?: number;
  gzipSavingsPercent?: number;
  changes: string[];
}
export const SVG_LIMITS = { maxBytes: 2 * 1024 * 1024, maxNodes: 4000, maxPaths: 1000, maxPathData: 400_000, maxBatch: 40, maxPackBytes: 8 * 1024 * 1024, maxPngSide: 2048, maxPngPixels: 16_000_000 } as const;

export async function measureGzipBytes(markup: string): Promise<number | undefined> {
  if (typeof CompressionStream !== 'function' || typeof Response !== 'function') return undefined;
  const blob = new Blob([markup]);
  if (typeof blob.stream !== 'function') return undefined;
  const compressed = blob.stream().pipeThrough(new CompressionStream('gzip'));
  return (await new Response(compressed).arrayBuffer()).byteLength;
}

const unsafeTagPattern = /<(script|iframe|object|embed|applet|foreignObject)\b[\s\S]*?<\/\1\s*>/gi;
const unsafeUrlPattern = /(javascript:|vbscript:|data:text\/html)/i;
const remoteUrlPattern = /^https?:\/\//i;

function parseSvg(markup: string): SVGElement {
  if (new TextEncoder().encode(markup).byteLength > SVG_LIMITS.maxBytes) throw new Error('SVG exceeds the 2 MB safety limit.');
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const parserError = parsed.querySelector('parsererror');
  const root = parsed.documentElement;
  if (parserError || !root || root.nodeName.toLowerCase() !== 'svg') throw new Error('SVG XML is malformed or has no <svg> root.');
  return root as unknown as SVGElement;
}

function attrValues(root: Element, name: string): string[] { return [...root.querySelectorAll(`[${name}]`)].map((element) => element.getAttribute(name) || '').filter(Boolean); }
function unique(values: string[]): string[] { return [...new Set(values.map((value) => value.trim()))].sort(); }
function serialize(root: Element): string { return new XMLSerializer().serializeToString(root); }

export function sanitizeSvgMarkup(markup: string): { svg: string; removed: string[] } {
  if (!markup.trim()) throw new Error('SVG input is empty.');
  const removed: string[] = [];
  const withoutTags = markup.replace(unsafeTagPattern, (_match, tag) => { removed.push(`${tag} element`); return ''; });
  const root = parseSvg(withoutTags);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      const isUrlAttribute = name === 'src' || name === 'href' || name === 'xlink:href';
      if (name.startsWith('on') || (isUrlAttribute && (unsafeUrlPattern.test(value) || remoteUrlPattern.test(value))) || /url\s*\(/i.test(value)) {
        element.removeAttribute(attribute.name); removed.push(`${name} attribute`);
      }
    }
    if (element.tagName.toLowerCase() === 'style') { element.remove(); removed.push('style element'); }
  }
  root.removeAttribute('xmlns:xlink');
  root.setAttribute('xmlns', root.getAttribute('xmlns') || 'http://www.w3.org/2000/svg');
  return { svg: serialize(root), removed };
}

export function inspectSvgMarkup(markup: string): SvgInspectorResult {
  const byteSize = new TextEncoder().encode(markup).byteLength;
  let root: SVGElement;
  try { root = parseSvg(markup); } catch (error) {
    return { status: 'FAIL', score: 0, checks: [{ label: 'XML', status: 'FAIL', detail: error instanceof Error ? error.message : 'Invalid SVG' }], viewBox: '', width: '', height: '', pathCount: 0, groupCount: 0, fills: [], strokes: [], strokeWidths: [], currentColor: false, title: '', description: '', byteSize, embeddedStyle: false, scriptCount: 0, externalReferenceCount: 0, unsafeCount: 1, hasFixedDimensions: false, accessible: false };
  }
  const all = [root, ...root.querySelectorAll('*')];
  const viewBox = root.getAttribute('viewBox') || '';
  const width = root.getAttribute('width') || '';
  const height = root.getAttribute('height') || '';
  const fills = unique([root.getAttribute('fill') || '', ...attrValues(root, 'fill')].filter(Boolean));
  const strokes = unique([root.getAttribute('stroke') || '', ...attrValues(root, 'stroke')].filter(Boolean));
  const strokeWidths = unique([root.getAttribute('stroke-width') || '', ...attrValues(root, 'stroke-width')].filter(Boolean));
  const scriptCount = all.filter((element) => ['script', 'iframe', 'object', 'embed', 'foreignObject'.toLowerCase()].includes(element.tagName.toLowerCase())).length;
  const externalReferenceCount = all.reduce((count, element) => count + [...element.attributes].filter((attribute) => ['href', 'xlink:href', 'src'].includes(attribute.name.toLowerCase()) && (unsafeUrlPattern.test(attribute.value) || remoteUrlPattern.test(attribute.value))).length, 0);
  const pathCount = root.querySelectorAll('path').length;
  const groupCount = root.querySelectorAll('g').length;
  const title = root.querySelector('title')?.textContent?.trim() || '';
  const description = root.querySelector('desc')?.textContent?.trim() || '';
  const embeddedStyle = root.querySelector('style') !== null;
  const unsafeCount = scriptCount + externalReferenceCount;
  const hasFixedDimensions = Boolean(width || height);
  const accessible = Boolean(title || root.getAttribute('role') || root.getAttribute('aria-label'));
  const checks: SvgCheck[] = [
    { label: 'Valid viewBox', status: /^\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$/.test(viewBox) ? 'PASS' : 'FAIL', detail: viewBox || 'Missing viewBox', fix: 'Add a positive numeric viewBox.' },
    { label: 'Safe markup', status: unsafeCount === 0 ? 'PASS' : 'FAIL', detail: unsafeCount ? `${unsafeCount} unsafe reference(s)` : 'No unsafe tag or URL detected', fix: 'Run sanitizer before preview/export.' },
    { label: 'Complexity', status: all.length <= SVG_LIMITS.maxNodes && pathCount <= SVG_LIMITS.maxPaths ? 'PASS' : 'FAIL', detail: `${all.length} nodes, ${pathCount} paths`, fix: 'Reduce nodes or upload a smaller SVG.' },
    { label: 'Dimensions', status: hasFixedDimensions ? 'WARNING' : 'PASS', detail: hasFixedDimensions ? 'Fixed width/height detected' : 'Responsive dimensions', fix: 'Use viewBox-only output when possible.' },
    { label: 'Accessibility', status: accessible ? 'PASS' : 'WARNING', detail: accessible ? 'Title, role, or label detected' : 'No title or accessible label', fix: 'Add <title> for meaningful icons or aria-hidden for decorative use.' },
    { label: 'currentColor', status: fills.length <= 1 || fills.includes('currentColor') ? 'PASS' : 'WARNING', detail: fills.length ? fills.join(', ') : 'No fill attribute', fix: 'Convert only monochrome SVGs to currentColor.' },
    { label: 'File size', status: byteSize <= SVG_LIMITS.maxBytes ? 'PASS' : 'FAIL', detail: `${byteSize.toLocaleString()} bytes`, fix: 'Optimize or reduce embedded data.' },
  ];
  const fail = checks.some((check) => check.status === 'FAIL');
  const warning = checks.some((check) => check.status === 'WARNING');
  const score = Math.max(0, Math.round((checks.filter((check) => check.status === 'PASS').length / checks.length) * 100));
  return { status: fail ? 'FAIL' : warning ? 'WARNING' : 'PASS', score, checks, viewBox, width, height, pathCount, groupCount, fills, strokes, strokeWidths, currentColor: fills.includes('currentColor') || strokes.includes('currentColor'), title, description, byteSize, embeddedStyle, scriptCount, externalReferenceCount, unsafeCount, hasFixedDimensions, accessible };
}

export function convertToCurrentColor(markup: string, mode: 'fill' | 'stroke' = 'fill'): { svg: string; converted: boolean } {
  const sanitized = sanitizeSvgMarkup(markup).svg;
  const root = parseSvg(sanitized);
  const values = unique([root.getAttribute(mode) || '', ...attrValues(root, mode)].filter((value) => value && value !== 'none' && value !== 'currentColor'));
  if (values.length > 1) return { svg: sanitized, converted: false };
  for (const element of [root, ...root.querySelectorAll('*')]) if (element.hasAttribute(mode) && element.getAttribute(mode) !== 'none') element.setAttribute(mode, 'currentColor');
  if (root.hasAttribute(mode) && root.getAttribute(mode) !== 'none') root.setAttribute(mode, 'currentColor');
  return { svg: serialize(root), converted: values.length > 0 };
}

export function applySvgEdits(markup: string, options: SvgEditOptions): string {
  const root = parseSvg(sanitizeSvgMarkup(markup).svg);
  if (options.colorMode === 'currentColor') return applySvgEdits(convertToCurrentColor(serialize(root)).svg, { ...options, colorMode: 'preserve' });
  if (options.colorMode === 'single') { root.setAttribute('fill', options.color || 'currentColor'); root.querySelectorAll('[fill]').forEach((node) => node.setAttribute('fill', options.color || 'currentColor')); }
  if (options.stroke) root.setAttribute('stroke', options.stroke);
  if (options.strokeWidth >= 0) root.setAttribute('stroke-width', String(options.strokeWidth));
  if (options.width) root.setAttribute('width', options.width);
  if (options.height) root.setAttribute('height', options.height);
  if (options.opacity >= 0 && options.opacity <= 1) root.setAttribute('opacity', String(options.opacity));
  const transforms = [`translate(12 12)`, `rotate(${options.rotation || 0})`, `scale(${options.flipX ? -1 : 1} ${options.flipY ? -1 : 1})`, 'translate(-12 -12)'].filter(Boolean);
  if (options.rotation || options.flipX || options.flipY) root.setAttribute('transform', transforms.join(' '));
  if (options.padding > 0) root.setAttribute('viewBox', `${-options.padding} ${-options.padding} ${24 + options.padding * 2} ${24 + options.padding * 2}`);
  if (options.background) root.insertAdjacentHTML('afterbegin', `<rect width="100%" height="100%" fill="${options.background.replace(/["<>]/g, '')}" />`);
  return serialize(root);
}

export function optimizeSvgMarkup(markup: string, preset: OptimizePreset = 'safe'): SvgOptimizationResult {
  const sanitized = sanitizeSvgMarkup(markup);
  const safe = sanitized.svg;
  const beforeBytes = new TextEncoder().encode(markup).byteLength;
  const root = parseSvg(safe);
  const changes: string[] = sanitized.removed.map((item) => `Removed ${item}`);
  root.querySelectorAll('comment, metadata, desc[id]').forEach((node) => { node.remove(); changes.push('Removed redundant metadata/comment nodes'); });
  if (preset !== 'safe') root.querySelectorAll('[id]').forEach((node) => { node.removeAttribute('id'); changes.push('Removed unnecessary IDs'); });
  if (preset === 'aggressive') { root.removeAttribute('width'); root.removeAttribute('height'); changes.push('Removed fixed dimensions'); }
  const svg = serialize(root).replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  const afterBytes = new TextEncoder().encode(svg).byteLength;
  const rawSavingsBytes = beforeBytes - afterBytes;
  const rawSavingsPercent = beforeBytes ? Math.round((rawSavingsBytes / beforeBytes) * 1000) / 10 : 0;
  if (afterBytes < beforeBytes) changes.push('Normalized whitespace');
  return { svg, beforeBytes, afterBytes, rawSavingsBytes, rawSavingsPercent, changes: [...new Set(changes)] };
}

export function svgToDataUri(svg: string): string { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
export function htmlSnippet(svg: string): string { return svg.trim(); }
export function cssBackgroundSnippet(svg: string): string { return `background-image: url("${svgToDataUri(svg)}");`; }
export function cssMaskSnippet(svg: string, selector = '.icon') { const uri = svgToDataUri(svg); return `${selector} { display: inline-block; width: 1em; height: 1em; background-color: currentColor; mask: url("${uri}") no-repeat center / contain; -webkit-mask: url("${uri}") no-repeat center / contain; }`; }
export function jsxSnippet(svg: string): string { return svg.replace(/\sclass=/g, ' className=').replace(/stroke-width=/g, 'strokeWidth=').replace(/fill-rule=/g, 'fillRule=').replace(/clip-rule=/g, 'clipRule='); }

function crc32(bytes: Uint8Array): number { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function u16(value: number): Uint8Array { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
function u32(value: number): Uint8Array { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
function concat(parts: Uint8Array[]): Uint8Array { const total = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(total); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }

export function createZip(files: ExportFile[]): Blob {
  if (files.length === 0 || files.length > SVG_LIMITS.maxBatch) throw new Error('Pack file count is outside the safe limit.');
  const encoder = new TextEncoder(); const local: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const file of files) { const name = encoder.encode(file.name); const crc = crc32(file.bytes); const header = concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), name, file.bytes]); local.push(header); central.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name])); offset += header.length; }
  const localBytes = concat(local); const centralBytes = concat(central); const end = concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralBytes.length), u32(localBytes.length), u16(0)]); return new Blob([localBytes as unknown as BlobPart, centralBytes as unknown as BlobPart, end as unknown as BlobPart], { type: 'application/zip' });
}

export function buildSprite(assets: Array<{ id: string; svg: string; viewBox?: string }>): string {
  const symbols = assets.map((asset) => { const root = parseSvg(asset.svg); root.querySelectorAll('title, desc').forEach((node) => node.remove()); const inner = root.innerHTML; return `<symbol id="icon-${asset.id.replace(/[^a-z0-9-]/gi, '-') }" viewBox="${asset.viewBox || root.getAttribute('viewBox') || '0 0 24 24'}">${inner}</symbol>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg"><defs>${symbols}</defs></svg>`;
}

export function buildCssPack(assets: Array<{ id: string }>): string { return `/* Generated locally by SVG Asset Studio */\n.icon { display:inline-block; width:1em; height:1em; fill:currentColor; }\n${assets.map((asset) => `.icon-${asset.id.replace(/[^a-z0-9-]/gi, '-')} { }`).join('\n')}`; }
export function buildManifestJson(assets: SvgAssetMetadata[]): string { return JSON.stringify(assets.map((asset) => ({ name: asset.id, file: asset.filename, viewBox: asset.viewBox, license: asset.license, source: asset.sourceUrl })), null, 2); }
export function buildLicensesTxt(assets: SvgAssetMetadata[]): string { return assets.map((asset) => [`Asset: ${asset.id}`, `Author: ${asset.author}`, `Source: ${asset.source}`, `License: ${asset.license}`, `License URL: ${asset.licenseUrl}`, `Source URL: ${asset.sourceUrl}`, `Attribution required: ${asset.attributionRequired ? 'yes' : 'no'}`, ''].join('\n')).join('\n'); }

export async function renderSvgToPng(svg: string, size: number, scale = 1): Promise<Blob> {
  const output = Math.max(1, Math.min(SVG_LIMITS.maxPngSide, Math.round(size * scale)));
  if (output * output > SVG_LIMITS.maxPngPixels) throw new Error('PNG output exceeds the pixel safety limit.');
  const blob = new Blob([svg], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob);
  try { const image = new Image(); image.decoding = 'async'; image.src = url; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = output; canvas.height = output; const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable.'); context.clearRect(0, 0, output, output); context.drawImage(image, 0, 0, output, output); return await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG encoding failed.')), 'image/png')); } finally { URL.revokeObjectURL(url); }
}
