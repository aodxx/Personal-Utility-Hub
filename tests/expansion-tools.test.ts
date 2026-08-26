import { describe, expect, it } from 'vitest';
import { decodeCsvBytes, detectCsvEncoding, encodeUtf8Bom } from '../src/core/csv-encoding';
import { parseFlowchartDsl, flowchartToSvg } from '../src/core/flowchart';
import { compareI18nJson } from '../src/core/json-i18n';
import { generateJsonLd, jsonLdScript } from '../src/core/json-ld';
import { parsePageOrder } from '../src/core/pdf-processing';

describe('expansion tool primitives', () => {
  it('parses and validates PDF page order', () => {
    expect(parsePageOrder('3,1,2', 3)).toEqual([2, 0, 1]);
    expect(parsePageOrder('', 3)).toEqual([0, 1, 2]);
    expect(() => parsePageOrder('1,1', 3)).toThrow('ห้ามซ้ำ');
  });

  it('detects UTF-8 Thai CSV and emits a BOM', async () => {
    const bytes = new TextEncoder().encode('ชื่อ,จำนวน\nทดสอบ,2');
    expect(decodeCsvBytes(bytes, 'utf-8')).toContain('ทดสอบ');
    expect(detectCsvEncoding(bytes).encoding).toBe('utf-8');
    const exported = new Uint8Array(await encodeUtf8Bom('ชื่อ').arrayBuffer());
    expect(Array.from(exported.slice(0, 3))).toEqual([0xEF, 0xBB, 0xBF]);
  });

  it('maps missing and extra nested i18n keys', () => {
    const result = compareI18nJson('{"app":{"title":"Title","save":"Save"}}', '{"app":{"title":"ชื่อ"},"old":"เก่า"}');
    expect(result.missingInTarget).toEqual(['app.save']);
    expect(result.extraInTarget).toEqual(['old']);
    expect(result.skeleton).toMatchObject({ app: { title: 'ชื่อ', save: 'TODO: Save' } });
  });

  it('generates supported JSON-LD types and script tags', () => {
    const json = generateJsonLd('Product', { name: 'Notebook', description: 'Local product', url: 'https://example.com/p', image: '', author: '', price: '12.5', currency: 'USD', faq: '', breadcrumbs: '' });
    expect(json).toMatchObject({ '@context': 'https://schema.org', '@type': 'Product', name: 'Notebook', offers: { price: 12.5, priceCurrency: 'USD' } });
    expect(jsonLdScript(json)).toContain('<script type="application/ld+json">');
  });

  it('parses a flowchart, avoids slug collisions, and escapes labels in SVG', () => {
    const model = parseFlowchartDsl('Start -> A B\nStart -> A-B\nA-B -> <Done>');
    expect(model.nodes).toHaveLength(4);
    expect(new Set(model.nodes.map((node) => node.id)).size).toBe(4);
    expect(model.edges).toHaveLength(3);
    expect(flowchartToSvg(model)).toContain('&lt;Done&gt;');
  });
});
