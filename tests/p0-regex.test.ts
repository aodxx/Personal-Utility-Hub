import { describe, expect, it } from 'vitest';
import {
  MAX_REGEX_INPUT_CHARS,
  MAX_REGEX_MATCHES,
  MAX_REGEX_REPLACEMENT_CHARS,
  regexLiteral,
  replaceRegex,
  runRegex,
} from '../src/core/regex';

describe('Regex Playground core', () => {
  it('returns the first match for non-global patterns and all matches for global patterns', () => {
    expect(runRegex('foo', '', 'foo foo').matches).toEqual([
      expect.objectContaining({ index: 0, end: 3, text: 'foo' }),
    ]);

    const result = runRegex(String.raw`(?<name>[A-Za-z]+)@(?<domain>[A-Za-z.]+)`, 'gi', 'Send A@EXAMPLE.COM and b@test.local');
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toMatchObject({
      index: 5,
      text: 'A@EXAMPLE.COM',
      groups: ['A', 'EXAMPLE.COM'],
      namedGroups: { name: 'A', domain: 'EXAMPLE.COM' },
    });
    expect(result.truncated).toBe(false);
    expect(result.durationMs).toEqual(expect.any(Number));
  });

  it('handles zero-length global matches without hanging', () => {
    const result = runRegex('(?=.)', 'g', 'abc');

    expect(result.matches.map(({ index, end, text }) => ({ index, end, text }))).toEqual([
      { index: 0, end: 0, text: '' },
      { index: 1, end: 1, text: '' },
      { index: 2, end: 2, text: '' },
    ]);
  });

  it('marks output as truncated at the match limit', () => {
    const result = runRegex('', 'g', 'x'.repeat(MAX_REGEX_MATCHES + 1));

    expect(result.matches).toHaveLength(MAX_REGEX_MATCHES);
    expect(result.truncated).toBe(true);
  });

  it('replaces globally, preserves replacement tokens and formats regex literals', () => {
    expect(replaceRegex('foo', 'g', 'foo foo', 'bar')).toBe('bar bar');
    expect(replaceRegex('(foo)', 'g', 'foo', '[$1]')).toBe('[foo]');
    expect(regexLiteral('a/b', 'gi')).toBe('/a\\/b/gi');
  });

  it('rejects invalid patterns and oversized input or replacement text', () => {
    expect(() => runRegex('[', 'g', 'text')).toThrow('Invalid pattern');
    expect(() => runRegex('a', 'gg', 'text')).toThrow('Invalid pattern');
    expect(() => runRegex('a', 'g', 'x'.repeat(MAX_REGEX_INPUT_CHARS + 1))).toThrow('Input exceeds');
    expect(() => replaceRegex('a', 'g', 'a', 'x'.repeat(MAX_REGEX_REPLACEMENT_CHARS + 1))).toThrow('Replacement exceeds');
  });
});
