import { describe, expect, it } from 'vitest';
import { ANIMATED_STICKER_PRESET, STATIC_STICKER_PRESET } from '../src/data/line-sticker-presets';
import { buildPrompt, createGrid, createZip, getGridCells, gridCells, gridCountMessage, moveBoundary, normalizedToSource, sourceToNormalized, validateAnimatedFrames, validateGrid } from '../src/tools/line-sticker-studio/logic';

describe('LINE Sticker Studio logic', () => {
  it('creates deterministic grid cells and movable boundaries', () => {
    const grid = createGrid(400, 300, 2, 2);
    expect(gridCells(grid)).toEqual([
      { x: 0, y: 0, width: 200, height: 150 },
      { x: 200, y: 0, width: 200, height: 150 },
      { x: 0, y: 150, width: 200, height: 150 },
      { x: 200, y: 150, width: 200, height: 150 },
    ]);
    expect(moveBoundary(grid.xBoundaries, 1, 20)[1]).toBe(20);
    expect(moveBoundary(grid.xBoundaries, 1, 250)[1]).toBe(250);
  });

  it('keeps non-divisible source dimensions gap-free and integer-safe', () => {
    const grid = createGrid(1537, 1539, 4, 4);
    const validation = validateGrid(grid, 1537, 1539);
    expect(validation.valid).toBe(true);
    const cells = getGridCells(grid, 1537, 1539);
    expect(cells).toHaveLength(16);
    expect(grid.xBoundaries[0]).toBe(0);
    expect(grid.xBoundaries.at(-1)).toBe(1537);
    expect(grid.yBoundaries[0]).toBe(0);
    expect(grid.yBoundaries.at(-1)).toBe(1539);
    expect(cells.reduce((sum, cell) => sum + cell.width, 0)).toBe(1537 * 4);
    expect(cells.slice(0, 4).map((cell) => cell.x)).toEqual([0, grid.xBoundaries[1], grid.xBoundaries[2], grid.xBoundaries[3]]);
  });

  it('rejects invalid boundaries before crop and preserves normalized/source parity', () => {
    const grid = createGrid(1536, 1536, 4, 4);
    grid.xBoundaries[2] = grid.xBoundaries[1] ?? 0;
    expect(validateGrid(grid, 1536, 1536).valid).toBe(false);
    expect(() => getGridCells(grid, 1536, 1536)).toThrow(/Grid ไม่ถูกต้อง/);
    expect(normalizedToSource(0.5, 1536)).toBe(768);
    expect(sourceToNormalized(768, 1536)).toBe(0.5);
  });

  it('maps a valid 4×4 grid in row-major order', () => {
    const cells = getGridCells(createGrid(1536, 1536, 4, 4), 1536, 1536);
    expect(cells.map((cell) => [cell.x, cell.y])).toEqual([
      [0, 0], [384, 0], [768, 0], [1152, 0],
      [0, 384], [384, 384], [768, 384], [1152, 384],
      [0, 768], [384, 768], [768, 768], [1152, 768],
      [0, 1152], [384, 1152], [768, 1152], [1152, 1152],
    ]);
  });

  it('warns when phrase count does not match grid capacity', () => {
    expect(gridCountMessage(3, 3, 9).level).toBe('PASS');
    expect(gridCountMessage(3, 3, 12).message).toContain('9 cells');
  });

  it('generates bilingual local-only prompts with consistency helpers', () => {
    const prompt = buildPrompt({ character: 'cat', style: 'cartoon', outfit: 'hoodie', expressions: 'happy', phrases: 'hello', language: 'English', count: 8, rows: 2, columns: 4, background: 'transparent', consistency: ['same character', 'no extra text'] });
    expect(prompt.th).toContain('cat');
    expect(prompt.en).toContain('2×4');
    expect(prompt.en).toContain('same character');
    expect(prompt.en).toContain('exact 2×4 grid');
    expect(prompt.en).toContain('no poster');
    expect(prompt.en).toContain('one character per cell');
  });

  it('preserves supplied Thai phrases and emits anti-layout guards', () => {
    const prompt = buildPrompt({ character: 'แมว', style: 'การ์ตูน', outfit: 'เสื้อฟ้า', expressions: 'ดีใจ, ขอโทษ', phrases: 'สวัสดี, ขอบคุณ', language: 'ไทย', count: 16, rows: 4, columns: 4, background: 'โปร่งใส', consistency: ['same face', 'same outfit'] });
    expect(prompt.th).toContain('พร้อมวลี สวัสดี, ขอบคุณ');
    expect(prompt.th).toContain('ห้ามสร้างคำใหม่');
    expect(prompt.en).toContain('do not translate');
    expect(prompt.en).toContain('no infographic');
  });

  it('uses the selected grid capacity as the workflow warning contract', () => {
    expect(gridCountMessage(4, 4, 16)).toEqual({ level: 'PASS', message: 'Grid count matches: 16 cells and 16 phrases.' });
    expect(gridCountMessage(4, 4, 2).level).toBe('WARNING');
  });

  it('creates an uncompressed ZIP with the expected local file signature', async () => {
    const zip = createZip([{ name: 'stickers/01.png', bytes: new Uint8Array([137, 80, 78, 71]) }, { name: 'validation-report.json', bytes: new TextEncoder().encode('{}') }]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder().decode(bytes)).toContain('validation-report.json');
  });

  it('validates animated frame constraints without claiming APNG export', () => {
    const checks = validateAnimatedFrames(Array.from({ length: 5 }, () => ({ width: 320, height: 270, bytes: 1000, hasAlpha: true })), ANIMATED_STICKER_PRESET, 2, 1);
    expect(checks.every((check) => check.level === 'PASS')).toBe(true);
    expect(STATIC_STICKER_PRESET.requiredCounts).toContain(8);
  });
});
