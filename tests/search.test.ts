import { describe, expect, it } from 'vitest';
import { filterTools, normalizeSearchText } from '../src/core/search';
import { toolCatalog } from '../src/data/tools';

describe('tool search', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeSearchText('  JSON   Formatter ')).toBe('json formatter');
  });

  it('searches title, description, category and tags', () => {
    expect(filterTools(toolCatalog, { query: 'JSON' }).map(({ id }) => id)).toEqual(['json-formatter', 'data-format-converter', 'json-visualizer', 'json-schema-generator', 'file-diff', 'jwt-inspector', 'json-i18n-mapper', 'json-ld-generator', 'flowchart-studio']);
    expect(filterTools(toolCatalog, { query: 'รูปภาพ' }).map(({ id }) => id)).toEqual([
      'image-resizer', 'image-converter', 'qr-reader', 'image-compressor', 'image-blur', 'images-to-pdf', 'file-metadata', 'image-contact-sheet', 'image-watermark', 'image-crop', 'line-sticker-studio', 'svg-asset-studio',
    ]);
    expect(filterTools(toolCatalog, { query: 'กล้อง' }).map(({ id }) => id)).toEqual(['qr-reader']);
  });

  it('combines category and favorite filters', () => {
    const favorites = new Set(['base64', 'image-resizer']);
    expect(filterTools(toolCatalog, { category: 'รูปภาพ', favorites, favoritesOnly: true }).map(({ id }) => id)).toEqual(['image-resizer']);
  });
});
