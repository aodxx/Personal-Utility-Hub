import { describe, expect, it } from 'vitest';
import { extensionForType, fitWithin, proportionalHeight, validateDimensions, validateImageFile } from '../src/core/image-processing';
import { assertToolModule } from '../src/core/tool-contract';
import { decodeBase64, encodeBase64 } from '../src/tools/base64/logic';
import { formatJson, minifyJson, parseJson } from '../src/tools/json-formatter/logic';
import { countText, transformText } from '../src/tools/text-formatter/logic';
import { coreTools } from '../src/data/core-tools';
import { toolRegistry } from '../src/data/tools';

describe('Phase 2 Core Tools', () => {
  it('registers all seven tools as active client-side modules', () => {
    expect(coreTools).toHaveLength(7);
    expect(coreTools.every(({ status, processing, supportsOffline }) => status === 'active' && processing === 'client-side' && supportsOffline)).toBe(true);
  });

  it('lazy-loads every Core Tool with metadata matching its Registry entry', async () => {
    const entries = toolRegistry.filter(({ metadata }) => metadata.id !== 'foundation-demo');
    for (const entry of entries) {
      const module = await entry.load();
      expect(() => assertToolModule(module, entry.metadata.id)).not.toThrow();
      expect(module.metadata).toBe(entry.metadata);
    }
  });

  it('formats, minifies and validates JSON', () => {
    expect(formatJson('{"name":"Hub","items":[1,2]}')).toContain('\n  "name": "Hub"');
    expect(minifyJson('{ "ok": true }')).toBe('{"ok":true}');
    expect(parseJson('false')).toBe(false);
    expect(() => parseJson('{bad}')).toThrow('JSON ไม่ถูกต้อง');
  });

  it('round-trips Unicode text through Base64', () => {
    const source = 'สวัสดี Utility Hub 🌿';
    expect(decodeBase64(encodeBase64(source))).toBe(source);
    expect(() => decodeBase64('not-valid')).toThrow('Base64 ไม่ถูกต้อง');
  });

  it('transforms text and counts Unicode characters', () => {
    expect(transformText('  one   two  \n\n three ', 'collapse-spaces')).toBe('one two\n\nthree');
    expect(transformText('one\n\n two', 'remove-blank-lines')).toBe('one\n two');
    expect(countText('ไทย test\nสอง')).toEqual({ characters: 12, words: 3, lines: 2 });
  });

  it('validates image limits and calculates proportional dimensions', () => {
    expect(proportionalHeight({ width: 1920, height: 1080 }, 1280)).toBe(720);
    expect(fitWithin({ width: 4000, height: 3000 }, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(extensionForType('image/jpeg')).toBe('jpg');
    expect(() => validateDimensions({ width: 12_001, height: 1 })).toThrow('ไม่เกิน');
    expect(() => validateDimensions({ width: 8_000, height: 4_000 })).toThrow('24 ล้าน');
    expect(() => validateImageFile(new File(['x'], 'photo.gif', { type: 'image/gif' }))).toThrow('PNG, JPEG และ WebP');
  });
});
