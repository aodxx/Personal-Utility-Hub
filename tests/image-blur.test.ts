import { describe, expect, it } from 'vitest';
import { normalizeRedactionRegion, validateRedactionOptions, validateRedactionRegion } from '../src/core/image-processing';

describe('image redaction geometry', () => {
  const dimensions = { width: 1000, height: 800 };

  it('normalizes reverse drag coordinates and clamps them to the image', () => {
    expect(normalizeRedactionRegion({ x: 900.4, y: 750.8 }, { x: -20, y: 120.2 }, dimensions)).toEqual({
      x: 0,
      y: 120,
      width: 901,
      height: 631,
    });
  });

  it('keeps a one-pixel region for a click without a meaningful drag', () => {
    expect(normalizeRedactionRegion({ x: 200, y: 300 }, { x: 200, y: 300 }, dimensions)).toEqual({
      x: 200,
      y: 300,
      width: 1,
      height: 1,
    });
  });

  it('rejects regions outside the source dimensions', () => {
    expect(() => validateRedactionRegion({ x: 900, y: 700, width: 101, height: 101 }, dimensions)).toThrow('กรอบเซนเซอร์ต้องอยู่ภายในรูปภาพ');
  });

  it('validates supported effects and strength bounds', () => {
    expect(() => validateRedactionOptions({ region: { x: 10, y: 10, width: 80, height: 80 }, effect: 'blur', strength: 16 }, dimensions)).not.toThrow();
    expect(() => validateRedactionOptions({ region: { x: 10, y: 10, width: 80, height: 80 }, effect: 'pixelate', strength: 64 }, dimensions)).not.toThrow();
    expect(() => validateRedactionOptions({ region: { x: 10, y: 10, width: 80, height: 80 }, effect: 'blur', strength: 1 }, dimensions)).toThrow('ความแรงของเอฟเฟกต์');
  });
});
