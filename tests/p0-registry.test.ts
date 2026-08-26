import { describe, expect, it } from 'vitest';
import { assertToolModule } from '../src/core/tool-contract';
import { toolRegistry } from '../src/data/tools';

const p0ToolIds = ['jwt-inspector', 'hash-verifier', 'regex-playground', 'color-contrast'] as const;

describe('P0 utility registry contracts', () => {
  it('keeps all four P0 utilities active, local and routable', () => {
    const entries = p0ToolIds.map((id) => toolRegistry.find(({ metadata }) => metadata.id === id));

    expect(entries).toHaveLength(4);
    for (const [index, entry] of entries.entries()) {
      const id = p0ToolIds[index];
      expect(entry).toBeDefined();
      expect(entry?.metadata).toMatchObject({
        id,
        route: `/tools/${id}`,
        processing: 'client-side',
        requiresFile: false,
        status: 'active',
      });
    }
  });

  it('lazy-loads each P0 module with metadata matching its registry entry', async () => {
    for (const id of p0ToolIds) {
      const entry = toolRegistry.find(({ metadata }) => metadata.id === id);
      if (!entry) throw new Error(`Missing P0 registry entry: ${id}`);

      const module = await entry.load();
      expect(() => assertToolModule(module, id)).not.toThrow();
      expect(module.metadata).toBe(entry.metadata);
      expect(module.mount).toEqual(expect.any(Function));
    }
  });
});
