import { describe, expect, it } from 'vitest';
import { assertValidRegistry, validateToolMetadata, type ToolMetadata } from '../src/core/tool-contract';
import { toolRegistry } from '../src/data/tools';

const metadata: ToolMetadata = {
  id: 'test-tool', title: 'Test', description: 'Test tool', category: 'Developer Tools',
  route: '/tools/test-tool', tags: ['test'], processing: 'client-side', supportsOffline: false,
  requiresFile: false, status: 'beta', version: '0.1.0',
};

describe('tool contract', () => {
  it('accepts valid metadata', () => {
    expect(validateToolMetadata(metadata)).toEqual([]);
  });

  it('rejects invalid ids and mismatched routes', () => {
    expect(validateToolMetadata({ ...metadata, id: 'Test Tool', route: '/wrong' })).toHaveLength(2);
  });

  it('prepares all SVG library assets for offline caching', async () => {
    const entry = toolRegistry.find(({ metadata: entryMetadata }) => entryMetadata.id === 'svg-asset-studio');
    expect(entry?.metadata.supportsOffline).toBe(true);
    const urls = await entry?.prepareOffline?.();
    expect(urls).toHaveLength(120);
    expect(new Set(urls).size).toBe(120);
    expect(urls?.every((url) => url.startsWith('./svg-assets/'))).toBe(true);
  });

  it('rejects duplicate registry entries', () => {
    const entry = { metadata, load: async () => ({ metadata, mount() {} }) };
    expect(() => assertValidRegistry([entry, entry])).toThrow('Tool id ซ้ำ');
  });
});
