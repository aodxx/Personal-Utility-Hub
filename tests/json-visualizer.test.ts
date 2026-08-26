import { describe, expect, it } from 'vitest';
import {
  JSON_VISUALIZER_LIMITS,
  defaultExpandedIds,
  graphNodeCount,
  matchingNodeIds,
  parseJsonTree,
  renderJsonGraphSvg,
  visibleNodes,
} from '../src/core/json-visualizer';

describe('JSON Visualizer core', () => {
  it('builds deterministic object, array, primitive kinds and JSON-like paths', () => {
    const model = parseJsonTree('{"user":{"display name":"Ada","roles":["admin",true],"score":42,"missing":null}}');
    expect(model.root.path).toBe('$');
    expect(model.nodes.map((node) => node.path)).toEqual([
      '$', '$.user', '$.user["display name"]', '$.user.roles', '$.user.roles[0]', '$.user.roles[1]', '$.user.score', '$.user.missing',
    ]);
    expect(model.nodes.map((node) => node.kind)).toEqual(['object', 'object', 'string', 'array', 'string', 'boolean', 'number', 'null']);
    expect(model.maxDepth).toBe(3);
  });

  it('truncates long string previews without changing the source model', () => {
    const value = 'x'.repeat(JSON_VISUALIZER_LIMITS.maxStringPreviewChars + 20);
    const model = parseJsonTree(JSON.stringify({ value }));
    const valueNode = model.nodes.find((node) => node.path === '$.value');
    expect(valueNode?.valuePreview.includes('…')).toBe(true);
    expect(valueNode?.valuePreview.length).toBeLessThanOrEqual(JSON_VISUALIZER_LIMITS.maxStringPreviewChars + 2);
  });

  it('rejects empty, oversized, too-deep and too-many-node inputs', () => {
    expect(() => parseJsonTree('   ')).toThrow(/กรุณาวาง JSON/);
    expect(() => parseJsonTree('x'.repeat(JSON_VISUALIZER_LIMITS.maxInputChars + 1))).toThrow(/200,000/);
    let deep = '0';
    for (let index = 0; index <= JSON_VISUALIZER_LIMITS.maxDepth; index += 1) deep = `{"nested":${deep}}`;
    expect(() => parseJsonTree(deep)).toThrow(/ความลึกเกิน/);
    const large = `{${Array.from({ length: JSON_VISUALIZER_LIMITS.maxNodes }, (_, index) => `"k${index}":${index}`).join(',')}}`;
    expect(() => parseJsonTree(large)).toThrow(/nodes เกิน/);
  });

  it('supports matching paths and preserves ancestors for focused tree exploration', () => {
    const model = parseJsonTree('{"profile":{"name":"Ada","city":"London"},"items":["book","lamp"]}');
    const matches = matchingNodeIds(model, 'london');
    const city = model.nodes.find((node) => node.path === '$.profile.city');
    expect(city).toBeDefined();
    expect(matches.has(city!.id)).toBe(true);
    const visible = visibleNodes(model, new Set(), 'london');
    expect(visible.map((node) => node.path)).toEqual(['$', '$.profile', '$.profile.city']);
  });

  it('collapses descendants and reports visible node counts deterministically', () => {
    const model = parseJsonTree('{"a":{"b":{"c":1}},"d":2}');
    const expanded = defaultExpandedIds(model);
    expect(graphNodeCount(model, expanded)).toBe(model.nodes.length);
    expanded.delete(model.root.children[0]!.id);
    expect(visibleNodes(model, expanded).map((node) => node.path)).toEqual(['$', '$.a', '$.d']);
    expect(graphNodeCount(model, expanded)).toBe(3);
  });

  it('escapes user-controlled labels and values in exported SVG', () => {
    const model = parseJsonTree('{"<script>":"</text>&\\\""}');
    const svg = renderJsonGraphSvg(model, defaultExpandedIds(model));
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&lt;/text&gt;&amp;');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('role="img"');
  });
});
