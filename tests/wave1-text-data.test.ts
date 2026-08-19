import { describe, expect, it } from 'vitest';
import { generateSchema } from '../src/tools/json-schema-generator/logic';
import { buildTable, parseTable } from '../src/tools/markdown-table-builder/logic';

describe('Wave 1 Text/Data tools', () => {
  it('generates deterministic nested JSON Schema with Unicode and arrays', () => {
    const schema = JSON.parse(generateSchema('{"ชื่อ":"ชุมชน","active":true,"items":[{"id":1},{"id":2}]}'));
    expect(schema.$schema).toContain('2020-12');
    expect(schema.properties['ชื่อ']).toEqual({ type: 'string' });
    expect(schema.properties.items.items.properties.id).toEqual({ type: 'integer' });
    expect(schema.required).toEqual(['active', 'items', 'ชื่อ']);
  });

  it('reports invalid JSON through the pure function', () => {
    expect(() => generateSchema('{broken')).toThrow();
  });

  it('builds a Markdown table from quoted CSV and escapes pipes', () => {
    const table = buildTable('Name,Note\nAod,"hello, world"\nทีมงาน,"a | b"');
    expect(table).toContain('| Name');
    expect(table).toContain('hello, world');
    expect(table).toContain('a \\| b');
  });

  it('supports TSV and pads missing cells', () => {
    const parsed = parseTable('A\tB\tC\n1\t2', '\t');
    expect(parsed.rows[0]).toEqual(['1', '2', '']);
    expect(buildTable('A\tB\n1', '\t')).toContain('| 1   |     |');
  });

  it('rejects empty table input', () => {
    expect(() => buildTable('')).toThrow();
  });
});
