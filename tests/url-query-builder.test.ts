import { describe, expect, it } from 'vitest';
import { buildUrl, formatQueryEntries, parseQueryEntries, parseUrl } from '../src/tools/url-query-builder/logic';

describe('URL Query String Builder', () => {
  it('parses Unicode, repeated keys, and hash without network access', () => {
    expect(parseUrl('https://example.com/search?q=ชุมชน&tag=a&tag=b#results')).toEqual({
      base: 'https://example.com/search',
      entries: [
        { key: 'q', value: 'ชุมชน' },
        { key: 'tag', value: 'a' },
        { key: 'tag', value: 'b' },
      ],
      hash: 'results',
    });
  });

  it('builds a deterministically encoded URL and preserves repeated key order', () => {
    expect(buildUrl('https://example.com/search', 'q=ชุมชน\ntag=a\ntag=b', '#results'))
      .toBe('https://example.com/search?q=%E0%B8%8A%E0%B8%B8%E0%B8%A1%E0%B8%8A%E0%B8%99&tag=a&tag=b#results');
  });

  it('parses and formats key-only and equals-containing values', () => {
    const entries = parseQueryEntries('flag=\nurl=https://example.com/a?b=c\nempty');
    expect(formatQueryEntries(entries)).toBe('flag=\nurl=https://example.com/a?b=c\nempty=');
  });

  it('rejects blank input', () => {
    expect(() => parseUrl('   ')).toThrow('กรุณากรอก URL');
    expect(() => buildUrl('', 'q=test')).toThrow('กรุณากรอก base URL หรือ path');
  });
});
