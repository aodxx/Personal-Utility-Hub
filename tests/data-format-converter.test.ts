import { describe, expect, it } from 'vitest';
import {
  DATA_FORMATS,
  MAX_INPUT_CHARS,
  convertData,
  formatDataError,
  parseData,
  DataFormatError,
} from '../src/tools/data-format-converter/logic';

describe('Data Format Converter logic', () => {
  it('declares the JSON-centered MVP format matrix', () => {
    expect(DATA_FORMATS).toEqual(['json', 'yaml', 'toml', 'xml']);
  });

  it('converts JSON to YAML with a normalized readable result', () => {
    const result = convertData('{"name":"Utility Hub","enabled":true}', 'json', 'yaml');
    expect(result.output).toContain('name: Utility Hub');
    expect(result.output).toContain('enabled: true');
    expect(result.warnings).toContain('YAML comments, anchors, aliases and custom tags may not round-trip exactly.');
  });

  it('converts YAML to JSON while preserving nested Unicode values', () => {
    const result = convertData('name: เครื่องมือ\nitems:\n  - id: 1\n    label: "พร้อมใช้"\n', 'yaml', 'json');
    expect(JSON.parse(result.output)).toEqual({ name: 'เครื่องมือ', items: [{ id: 1, label: 'พร้อมใช้' }] });
    expect(result.warnings).toContain('YAML comments, anchors, aliases and custom tags may not round-trip exactly.');
  });

  it('converts TOML to JSON and JSON to TOML', () => {
    const fromToml = convertData('title = "Example"\n[owner]\nname = "Ada"\n', 'toml', 'json');
    expect(JSON.parse(fromToml.output)).toEqual({ title: 'Example', owner: { name: 'Ada' } });
    const toToml = convertData('{"title":"Example","owner":{"name":"Ada"}}', 'json', 'toml');
    expect(toToml.output).toContain('title = "Example"');
    expect(toToml.output).toContain('[owner]');
    expect(toToml.warnings).toContain('TOML dates, table ordering and format-specific types may change during conversion.');
  });

  it('converts XML with explicit attributes and repeated child elements', () => {
    const result = convertData('<config><item id="1">one</item><item id="2">two</item></config>', 'xml', 'json');
    expect(JSON.parse(result.output)).toEqual({ config: { item: [{ '#text': 'one', '@_id': '1' }, { '#text': 'two', '@_id': '2' }] } });
    expect(result.warnings).toContain('XML attributes, namespaces, comments and mixed-content ordering may not round-trip exactly.');
    const xml = convertData('{"config":{"item":[{"@_id":"1","#text":"one"}]}}', 'json', 'xml');
    expect(xml.output).toContain('<root>');
    expect(xml.output).toContain('<item id="1">one</item>');
    expect(xml.warnings).toContain('JSON-like values are wrapped in a generated <root> element for XML output.');
  });

  it('reports JSON, YAML, TOML and XML diagnostics with location when available', () => {
    for (const [source, format, expected] of [
      ['{"name": }', 'json', 'line 1, column 10'],
      ['name:\n  - broken\n    value: 1\n  - next', 'yaml', 'line 2'],
      ['name = demo', 'toml', 'line 1, column 8'],
      ['<config><name></config>', 'xml', 'line 1, column 15'],
    ] as const) {
      try {
        parseData(source, format);
        throw new Error(`${format} unexpectedly parsed`);
      } catch (error) {
        expect(formatDataError(error)).toContain(expected);
      }
    }
  });

  it('normalizes parser errors without inventing unavailable locations', () => {
    const error = new DataFormatError('TOML is invalid: invalid value', { format: 'toml', line: 2, column: 4 });
    expect(formatDataError(error)).toBe('TOML is invalid: invalid value (line 2, column 4)');
    expect(formatDataError(new Error('plain error'))).toBe('plain error');
  });

  it('rejects empty and oversized input before parsing', () => {
    expect(() => parseData('   ', 'json')).toThrow('JSON input is empty');
    expect(() => parseData('x'.repeat(MAX_INPUT_CHARS + 1), 'yaml')).toThrow(/exceeds 500,000 characters/);
  });

  it('rejects TOML output when normalized value is not a root table', () => {
    expect(() => convertData('[1, 2]', 'json', 'toml')).toThrow(/TOML output could not be built/);
  });
});
