import { describe, expect, it } from 'vitest';
import { ANIMATED_STICKER_PRESET, STATIC_STICKER_PRESET } from '../src/data/line-sticker-presets';
import { buildPrompt, createGrid, createZip, gridCells, gridCountMessage, moveBoundary, validateAnimatedFrames } from '../src/tools/line-sticker-studio/logic';

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
