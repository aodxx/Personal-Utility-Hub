import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  evaluateContrast,
  formatContrastRatio,
  parseColor,
  relativeLuminance,
  toHex,
} from '../src/core/color-contrast';

describe('Color Contrast Checker core', () => {
  it('parses 3, 6 and 8 digit HEX colors', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, alpha: 1 });
    expect(parseColor('112233')).toEqual({ r: 17, g: 34, b: 51, alpha: 1 });
    expect(parseColor('#00000080')).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(parseColor('#00000080').alpha).toBeCloseTo(128 / 255, 6);
    expect(toHex(parseColor('#abc'))).toBe('#AABBCC');
  });

  it('parses RGB and RGBA syntax including percentage alpha', () => {
    expect(parseColor('rgb(31, 41, 59)')).toEqual({ r: 31, g: 41, b: 59, alpha: 1 });
    expect(parseColor('rgba(31,41,59,0.5)')).toEqual({ r: 31, g: 41, b: 59, alpha: 0.5 });
    expect(parseColor('rgba(31, 41, 59, 50%)')).toEqual({ r: 31, g: 41, b: 59, alpha: 0.5 });
  });

  it('rejects invalid formats and out-of-range channels or alpha', () => {
    expect(() => parseColor('')).toThrow('Invalid color format');
    expect(() => parseColor('#12')).toThrow('Invalid color format');
    expect(() => parseColor('rgb(256, 0, 0)')).toThrow('RGB values must be between 0 and 255');
    expect(() => parseColor('rgba(0, 0, 0, 1.1)')).toThrow('Alpha must be between 0 and 1');
    expect(() => parseColor('rgba(0, 0, 0, -1%)')).toThrow('Alpha must be between 0 and 1');
  });

  it('calculates luminance and symmetric contrast ratios', () => {
    const black = parseColor('#000000');
    const white = parseColor('#ffffff');

    expect(relativeLuminance(black)).toBe(0);
    expect(relativeLuminance(white)).toBe(1);
    expect(contrastRatio(black, white)).toBe(21);
    expect(contrastRatio(white, black)).toBe(21);
    expect(formatContrastRatio(21)).toBe('21.00:1');
  });

  it('evaluates WCAG decisions for strong and weak contrast', () => {
    expect(evaluateContrast('#000000', '#ffffff')).toEqual({
      ratio: 21,
      normalAa: true,
      normalAaa: true,
      largeAa: true,
      largeAaa: true,
      nonTextAa: true,
    });
    expect(evaluateContrast('#777777', '#ffffff')).toMatchObject({
      normalAa: false,
      normalAaa: false,
      largeAa: true,
      largeAaa: false,
      nonTextAa: true,
    });
  });

  it('rejects translucent colors because this version only supports opaque inputs', () => {
    expect(() => evaluateContrast('#ffffff80', '#000000')).toThrow('รองรับสีทึบเท่านั้น');
    expect(() => contrastRatio(parseColor('rgba(0, 0, 0, 0.5)'), parseColor('#ffffff'))).toThrow('opaque colors only');
  });
});
