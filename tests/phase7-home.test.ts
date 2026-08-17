import { describe, expect, it } from 'vitest';
import { LocalPreferences } from '../src/core/storage';
import { mostUsedTools } from '../src/core/tool-order';
import type { ToolMetadata } from '../src/core/tool-contract';

const tool = (id: string, status: ToolMetadata['status'] = 'active'): ToolMetadata => ({
  id,
  title: id,
  description: id,
  category: 'Test',
  route: `/tools/${id}`,
  tags: ['test'],
  processing: 'client-side',
  supportsOffline: false,
  requiresFile: false,
  status,
  version: '1.0.0',
});

describe('Phase 7 home personalization', () => {
  const tools = [tool('image-compressor'), tool('pdf-merge'), tool('qr-generator'), tool('json-formatter'), tool('audio-trimmer'), tool('planned', 'planned')];
  const order = tools.map(({ id }) => id);

  it('returns five most-used active tools in descending usage order', () => {
    const result = mostUsedTools(tools, { 'audio-trimmer': 2, 'pdf-merge': 8, 'json-formatter': 4, planned: 99 }, ['image-compressor', 'pdf-merge', 'qr-generator', 'json-formatter', 'audio-trimmer'], order);
    expect(result.map(({ id }) => id)).toEqual(['pdf-merge', 'json-formatter', 'audio-trimmer', 'image-compressor', 'qr-generator']);
    expect(result).toHaveLength(5);
    expect(result.some(({ id }) => id === 'planned')).toBe(false);
  });

  it('uses deterministic catalog order for ties and missing counts', () => {
    const result = mostUsedTools(tools, { 'pdf-merge': 3, 'image-compressor': 3 }, [], order);
    expect(result.map(({ id }) => id).slice(0, 2)).toEqual(['image-compressor', 'pdf-merge']);
  });

  it('uses the five-tool fallback for a new user', () => {
    const result = mostUsedTools(tools, {}, ['image-compressor', 'pdf-merge', 'qr-generator', 'json-formatter', 'audio-trimmer'], order);
    expect(result.map(({ id }) => id)).toEqual(['image-compressor', 'pdf-merge', 'qr-generator', 'json-formatter', 'audio-trimmer']);
  });

  it('clears usage without changing favorites, locale, or theme', () => {
    const storage = new Map<string, string>();
    const fakeStorage: Storage = {
      get length() { return storage.size; },
      clear: () => storage.clear(),
      getItem: (key) => storage.get(key) ?? null,
      key: (index) => [...storage.keys()][index] ?? null,
      removeItem: (key) => storage.delete(key),
      setItem: (key, value) => storage.set(key, value),
    };
    const preferences = new LocalPreferences(fakeStorage);
    preferences.recordUse('pdf-merge');
    preferences.toggleFavorite('json-formatter');
    preferences.setLocale('en');
    preferences.setTheme('dark');
    preferences.clearUsage();
    expect(preferences.getUsage()).toEqual({});
    expect(preferences.getFavorites()).toEqual(new Set(['json-formatter']));
    expect(preferences.getLocale()).toBe('en');
    expect(preferences.getTheme()).toBe('dark');
  });
});
