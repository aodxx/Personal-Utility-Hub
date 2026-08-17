import type { LineStickerPreset } from '../../data/line-sticker-presets';

export interface GridConfig {
  rows: number;
  columns: number;
  xBoundaries: number[];
  yBoundaries: number[];
}

export interface GridCell { x: number; y: number; width: number; height: number; }

export interface StickerTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  fit: 'contain' | 'cover';
}

export interface StickerStyle {
  keyColor: string;
  tolerance: number;
  feather: number;
  strokeColor: string;
  strokeWidth: number;
  showSafeMargin: boolean;
}

export interface QualityResult {
  level: 'PASS' | 'WARNING' | 'FAIL';
  checks: Array<{ label: string; level: 'PASS' | 'WARNING' | 'FAIL'; detail: string; fix: string }>;
  contentBounds?: { left: number; top: number; right: number; bottom: number; width: number; height: number };
  hasTransparency: boolean;
  byteSize?: number;
}

export interface ValidationSummary {
  pass: number;
  warning: number;
  fail: number;
  issues: Array<{ sticker: string; level: string; detail: string; fix: string }>;
}

export interface ExportFile { name: string; bytes: Uint8Array; }

export function equalizeBoundaries(length: number, segments: number): number[] {
  if (!Number.isInteger(length) || length < 1 || !Number.isInteger(segments) || segments < 1) throw new Error('Grid dimensions are invalid');
  return Array.from({ length: segments + 1 }, (_, index) => Math.round((index / segments) * length));
}

export function createGrid(width: number, height: number, rows: number, columns: number): GridConfig {
  if (rows < 1 || columns < 1 || rows * columns > 24) throw new Error('Grid must contain between 1 and 24 cells');
  return { rows, columns, xBoundaries: equalizeBoundaries(width, columns), yBoundaries: equalizeBoundaries(height, rows) };
}

export function gridCells(grid: GridConfig): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const x = grid.xBoundaries[column] ?? 0;
      const y = grid.yBoundaries[row] ?? 0;
      const nextX = grid.xBoundaries[column + 1] ?? x + 1;
      const nextY = grid.yBoundaries[row + 1] ?? y + 1;
      cells.push({ x, y, width: Math.max(1, nextX - x), height: Math.max(1, nextY - y) });
    }
  }
  return cells;
}

export interface GridValidation { valid: boolean; errors: string[]; }

export function validateGrid(grid: GridConfig, sourceWidth: number, sourceHeight: number): GridValidation {
  const errors: string[] = [];
  if (!Number.isInteger(grid.rows) || grid.rows < 1 || !Number.isInteger(grid.columns) || grid.columns < 1) errors.push('Rows and columns must be positive integers');
  if (grid.rows * grid.columns > 24) errors.push('Grid must contain between 1 and 24 cells');
  if (!Number.isInteger(sourceWidth) || sourceWidth < 1 || !Number.isInteger(sourceHeight) || sourceHeight < 1) errors.push('Source dimensions are invalid');
  if (grid.xBoundaries.length !== grid.columns + 1 || grid.yBoundaries.length !== grid.rows + 1) errors.push('Grid boundary count is invalid');
  const checkAxis = (boundaries: number[], dimension: number, label: string): void => { if (boundaries[0] !== 0) errors.push(`${label} must start at 0`); if (boundaries[boundaries.length - 1] !== dimension) errors.push(`${label} must end at source dimension`); boundaries.forEach((value, index) => { if (!Number.isInteger(value)) errors.push(`${label} boundary ${index} must be an integer`); if (index > 0 && value <= (boundaries[index - 1] ?? -1)) errors.push(`${label} boundaries must be strictly increasing`); }); };
  checkAxis(grid.xBoundaries, sourceWidth, 'X'); checkAxis(grid.yBoundaries, sourceHeight, 'Y');
  if (errors.length === 0 && gridCells(grid).some((cell) => cell.width < 1 || cell.height < 1)) errors.push('Every cell must have positive dimensions');
  return { valid: errors.length === 0, errors };
}

export function getGridCells(grid: GridConfig, sourceWidth: number, sourceHeight: number): GridCell[] {
  const validation = validateGrid(grid, sourceWidth, sourceHeight);
  if (!validation.valid) throw new Error(`Grid ไม่ถูกต้อง กรุณาปรับเส้นตัดก่อน: ${validation.errors.join('; ')}`);
  return gridCells(grid);
}

export function normalizedToSource(value: number, dimension: number): number { if (!Number.isFinite(value) || !Number.isFinite(dimension) || dimension < 1) throw new Error('Invalid normalized coordinate'); return Math.round(Math.max(0, Math.min(1, value)) * dimension); }
export function sourceToNormalized(value: number, dimension: number): number { if (!Number.isFinite(value) || !Number.isFinite(dimension) || dimension < 1) throw new Error('Invalid source coordinate'); return Math.max(0, Math.min(1, value / dimension)); }

export function moveBoundary(boundaries: number[], index: number, value: number, minGap = 2): number[] {
  if (index <= 0 || index >= boundaries.length - 1) return boundaries.slice();
  const next = boundaries.slice();
  const previous = boundaries[index - 1] ?? 0;
  const following = boundaries[index + 1] ?? previous + minGap;
  next[index] = Math.max(previous + minGap, Math.min(following - minGap, Math.round(value)));
  return next;
}

export function gridCountMessage(rows: number, columns: number, phraseCount: number): { level: 'PASS' | 'WARNING'; message: string } {
  const capacity = rows * columns;
  if (phraseCount <= 0) return { level: 'WARNING', message: 'Add phrases to compare with the selected grid.' };
  if (phraseCount === capacity) return { level: 'PASS', message: `Grid count matches: ${capacity} cells and ${phraseCount} phrases.` };
  return { level: 'WARNING', message: `Grid has ${capacity} cells but the prompt contains ${phraseCount} phrases.` };
}

function parseHex(color: string): [number, number, number] {
  const clean = color.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(clean)) return [255, 255, 255];
  return [Number.parseInt(clean.slice(0, 2), 16), Number.parseInt(clean.slice(2, 4), 16), Number.parseInt(clean.slice(4, 6), 16)];
}

export function removeColorKey(imageData: ImageData, color: string, tolerance: number, feather: number): ImageData {
  const [r, g, b] = parseHex(color);
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const data = result.data;
  const threshold = Math.max(0, Math.min(255, tolerance));
  const featherSize = Math.max(1, Math.min(100, feather));
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 0; const green = data[index + 1] ?? 0; const blue = data[index + 2] ?? 0; const alphaIndex = index + 3; const alpha = data[alphaIndex] ?? 0;
    const distance = Math.sqrt((red - r) ** 2 + (green - g) ** 2 + (blue - b) ** 2);
    if (distance <= threshold) data[alphaIndex] = 0;
    else if (distance <= threshold + featherSize) data[alphaIndex] = Math.round(alpha * ((distance - threshold) / featherSize));
  }
  return result;
}

export function contentBounds(imageData: ImageData, alphaThreshold = 12): QualityResult['contentBounds'] {
  const { data, width, height } = imageData;
  let left = width; let top = height; let right = -1; let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) > alphaThreshold) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < 0) return undefined;
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

export function hasTransparency(imageData: ImageData): boolean {
  for (let index = 3; index < imageData.data.length; index += 4) if ((imageData.data[index] ?? 255) < 255) return true;
  return false;
}

export function inspectSticker(imageData: ImageData, preset: LineStickerPreset, byteSize?: number): QualityResult {
  const bounds = contentBounds(imageData);
  const transparent = hasTransparency(imageData);
  const checks: QualityResult['checks'] = [];
  const even = imageData.width % 2 === 0 && imageData.height % 2 === 0;
  checks.push({ label: 'Dimensions', level: imageData.width <= (preset.dimensions.maxWidth ?? preset.dimensions.width) && imageData.height <= (preset.dimensions.maxHeight ?? preset.dimensions.height) && even ? 'PASS' : 'FAIL', detail: `${imageData.width} × ${imageData.height}`, fix: 'Resize to the selected LINE preset.' });
  checks.push({ label: 'Transparency', level: transparent || !preset.transparencyRequired ? 'PASS' : 'FAIL', detail: transparent ? 'Alpha channel detected' : 'Canvas is fully opaque', fix: 'Run background cleanup and keep the checkerboard transparent.' });
  const margin = bounds ? Math.min(bounds.left, bounds.top, imageData.width - bounds.right - 1, imageData.height - bounds.bottom - 1) : 0;
  checks.push({ label: 'Content bounds', level: !bounds ? 'FAIL' : margin < 6 ? 'WARNING' : 'PASS', detail: bounds ? `${margin}px minimum edge margin` : 'No visible content', fix: !bounds ? 'Add visible sticker content.' : 'Use Auto Fit or add a safe margin.' });
  checks.push({ label: 'File size', level: byteSize === undefined || byteSize <= preset.maxBytes ? 'PASS' : 'FAIL', detail: byteSize === undefined ? 'Encode before final validation' : `${byteSize.toLocaleString()} bytes`, fix: 'Reduce dimensions or export settings.' });
  const level = checks.some((check) => check.level === 'FAIL') ? 'FAIL' : checks.some((check) => check.level === 'WARNING') ? 'WARNING' : 'PASS';
  return { level, checks, contentBounds: bounds, hasTransparency: transparent, byteSize };
}

export function validateAnimatedFrames(frames: Array<{ width: number; height: number; bytes: number; hasAlpha: boolean }>, preset: LineStickerPreset, playbackSeconds: number, loops: number): QualityResult['checks'] {
  const constraints = preset.animation!;
  const checks: QualityResult['checks'] = [];
  checks.push({ label: 'Frame count', level: frames.length >= constraints.minFrames && frames.length <= constraints.maxFrames ? 'PASS' : 'FAIL', detail: `${frames.length} frames`, fix: `Use ${constraints.minFrames}–${constraints.maxFrames} frames.` });
  checks.push({ label: 'Playback', level: playbackSeconds > 0 && playbackSeconds <= constraints.maxPlaybackSeconds ? 'PASS' : 'FAIL', detail: `${playbackSeconds.toFixed(2)} seconds`, fix: `Keep playback at or below ${constraints.maxPlaybackSeconds} seconds.` });
  checks.push({ label: 'Loops', level: loops >= constraints.minLoops && loops <= constraints.maxLoops ? 'PASS' : 'FAIL', detail: `${loops} loops`, fix: `Use ${constraints.minLoops}–${constraints.maxLoops} loops.` });
  checks.push({ label: 'Frames', level: frames.every((frame) => frame.width <= 320 && frame.height <= 270 && frame.hasAlpha && frame.bytes <= preset.maxBytes) ? 'PASS' : 'FAIL', detail: 'Dimensions, transparency and byte guard', fix: 'Resize, remove background, and encode each frame under 1 MB.' });
  return checks;
}

export function createValidationSummary(results: Array<{ name: string; quality: QualityResult }>): ValidationSummary {
  const summary: ValidationSummary = { pass: 0, warning: 0, fail: 0, issues: [] };
  for (const result of results) {
    if (result.quality.level === 'PASS') summary.pass += 1;
    else if (result.quality.level === 'WARNING') summary.warning += 1;
    else summary.fail += 1;
    for (const check of result.quality.checks) if (check.level !== 'PASS') summary.issues.push({ sticker: result.name, level: check.level, detail: check.detail, fix: check.fix });
  }
  return summary;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Uint8Array { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
function u32(value: number): Uint8Array { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
function concat(parts: Uint8Array[]): Uint8Array { const total = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(total); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; }

export function createZip(files: ExportFile[]): Blob {
  const encoder = new TextEncoder();
  const local: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name); const crc = crc32(file.bytes);
    const header = concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), name, file.bytes]);
    local.push(header);
    central.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.bytes.length), u32(file.bytes.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
    offset += header.length;
  }
  const localBytes = concat(local); const centralBytes = concat(central);
  const end = concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralBytes.length), u32(localBytes.length), u16(0)]);
  return new Blob([localBytes as unknown as BlobPart, centralBytes as unknown as BlobPart, end as unknown as BlobPart], { type: 'application/zip' });
}

export function buildPrompt(input: { character: string; style: string; outfit: string; expressions: string; phrases: string; language: string; count: number; rows: number; columns: number; background: string; consistency: string[] }): { th: string; en: string } {
  const consistency = input.consistency.join(', ');
  const grid = `${input.rows}×${input.columns}`;
  const thai = /thai|ไทย/i.test(input.language);
  const shared = `same person/character, same face, same hairstyle, same outfit, same rendering style, consistent proportions, ${consistency || 'same colors and consistent line work'}, one character per cell, each cell has a different pose or expression, exact ${grid} grid, equal-sized cells, clear separation between cells, suitable ${input.background || 'transparent'} background, no poster, no infographic, no title, no decorative frame, no extra character, no extra text, no duplicate pose`;
  const phraseRule = thai ? 'Use exactly the supplied Thai phrases; do not translate, do not add punctuation unless provided, and do not invent extra words.' : 'Use exactly the supplied phrases without adding or inventing text.';
  return {
    th: `สร้าง sticker sheet ${grid} จำนวน ${input.count} ช่อง ของตัวละคร ${input.character || 'ตัวละครหลัก'} ในสไตล์ ${input.style || 'illustration'} สวม ${input.outfit || 'ชุดประจำตัว'} แสดงอารมณ์/ท่าทาง ${input.expressions || 'หลากหลาย'} พร้อมวลี ${input.phrases || 'ข้อความสั้นใช้งานในแชต'} ใช้ภาษา ${input.language || 'ไทย'} พื้นหลัง ${input.background || 'โปร่งใส'} โดยใช้ตัวละครเดิม ใบหน้าเดิม ทรงผมเดิม ชุดเดิม สไตล์การวาดเดิม สัดส่วนสม่ำเสมอ หนึ่งตัวละครต่อหนึ่งช่อง แต่ละช่องต้องมีท่าหรืออารมณ์ต่างกัน ช่องเท่ากัน เส้นแบ่งชัดเจน และห้ามทำเป็นโปสเตอร์ อินโฟกราฟิก ชื่อเรื่อง กรอบตกแต่ง ตัวละครเกิน ข้อความเกิน หรือท่าซ้ำ ${phraseRule} ห้ามสร้างคำใหม่`,
    en: `Create an exact ${grid} sticker sheet with ${input.count} equal cells for ${input.character || 'the main character'}, in ${input.style || 'illustration'} style, wearing ${input.outfit || 'the character outfit'}, showing ${input.expressions || 'varied expressions and poses'}, with the supplied phrases: ${input.phrases || 'short chat-friendly phrases'} in ${input.language || 'Thai'}. ${shared}. ${phraseRule}`,
  };
}
