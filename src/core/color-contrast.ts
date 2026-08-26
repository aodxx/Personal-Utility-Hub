export interface RgbColor {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

export interface ContrastResult {
  ratio: number;
  normalAa: boolean;
  normalAaa: boolean;
  largeAa: boolean;
  largeAaa: boolean;
  nonTextAa: boolean;
}

function channel(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 255) throw new Error('ค่า RGB ต้องอยู่ระหว่าง 0 ถึง 255 / RGB values must be between 0 and 255');
  return Math.round(parsed);
}

function alphaChannel(value: string): number {
  const raw = value.trim();
  const parsed = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) throw new Error('ค่า alpha ต้องอยู่ระหว่าง 0 ถึง 1 / Alpha must be between 0 and 1');
  return parsed;
}

export function parseColor(value: string): RgbColor {
  const input = value.trim();
  const hex = input.replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return { r: parseInt(`${hex[0]}${hex[0]}`, 16), g: parseInt(`${hex[1]}${hex[1]}`, 16), b: parseInt(`${hex[2]}${hex[2]}`, 16), alpha: 1 };
  }
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), alpha: 1 };
  }
  if (/^[0-9a-f]{8}$/i.test(hex)) {
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), alpha: parseInt(hex.slice(6, 8), 16) / 255 };
  }

  const rgb = input.match(/^rgba?\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^,)]+))?\s*\)$/i);
  if (rgb) return { r: channel(rgb[1]!), g: channel(rgb[2]!), b: channel(rgb[3]!), alpha: rgb[4] === undefined ? 1 : alphaChannel(rgb[4]) };
  throw new Error('รูปแบบสีไม่ถูกต้อง / Invalid color format; use HEX, RGB or RGBA');
}

export function toHex(color: RgbColor): string {
  return `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function linearize(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: RgbColor): number {
  return 0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b);
}

export function contrastRatio(foreground: RgbColor, background: RgbColor): number {
  if (foreground.alpha < 1 || background.alpha < 1) throw new Error('Contrast checker รุ่นนี้รองรับสีทึบเท่านั้น / This version supports opaque colors only');
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function evaluateContrast(foreground: string | RgbColor, background: string | RgbColor): ContrastResult {
  const foregroundColor = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  const backgroundColor = typeof background === 'string' ? parseColor(background) : background;
  const ratio = contrastRatio(foregroundColor, backgroundColor);
  return { ratio, normalAa: ratio >= 4.5, normalAaa: ratio >= 7, largeAa: ratio >= 3, largeAaa: ratio >= 4.5, nonTextAa: ratio >= 3 };
}

export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
