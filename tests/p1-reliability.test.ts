import { describe, expect, it } from 'vitest';
import { compressionSavingPercent } from '../src/core/file-processing';
import { compare } from '../src/tools/file-diff';
import { cleanedRows, parseCsv } from '../src/tools/csv-profiler';

describe('P1 reliability regressions', () => {
  it('treats an inserted line as one addition instead of cascading changes', () => {
    const result = compare('alpha\nbeta\ngamma', 'alpha\ninserted\nbeta\ngamma');
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.changed).toBe(0);
    expect(result.report).toContain('+ inserted');
  });

  it('parses quoted newlines and semicolon-delimited CSV records', () => {
    const result = parseCsv('name;note\nAlice;"line one\nline two"\nBob;ok');
    expect(result.headers).toEqual(['name', 'note']);
    expect(result.rows).toEqual([['Alice', 'line one\nline two'], ['Bob', 'ok']]);
  });

  it('deduplicates after trimming so cleaned statistics match exported rows', () => {
    const result = parseCsv('name,score\n Alice ,1\nAlice,1\nBob,2');
    expect(cleanedRows(result, true, true)).toEqual([['Alice', '1'], ['Bob', '2']]);
  });

  it('reports negative saving when an encoded image is larger', () => {
    expect(compressionSavingPercent(100, 176)).toBe(-76);
    expect(compressionSavingPercent(100, 80)).toBe(20);
  });
});
