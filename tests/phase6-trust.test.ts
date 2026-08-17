import { describe, expect, it } from 'vitest';
import { parseHash } from '../src/app/routes';
import { toolCatalog } from '../src/data/tools';
import { getToolGuide, toolGuides } from '../src/data/guides';
import { guideHasRequiredContent } from '../src/core/tool-guide';
import { LocalPreferences } from '../src/core/storage';

describe('Phase 6 trust and guide contracts', () => {
  it('recognizes the privacy route without changing tool routes', () => {
    expect(parseHash('#/privacy')).toEqual({ kind: 'privacy' });
    expect(parseHash('#/tools/json-formatter')).toEqual({ kind: 'tool', toolId: 'json-formatter' });
  });

  it('provides a valid bilingual guide for every active tool', () => {
    const active = toolCatalog.filter((tool) => tool.status === 'active' || tool.status === 'beta');
    expect(toolGuides).toHaveLength(active.length);
    for (const tool of active) {
      const guide = getToolGuide(tool.id);
      expect(guide).toBeDefined();
      expect(guideHasRequiredContent(guide!)).toBe(true);
      expect(guide?.toolId).toBe(tool.id);
      expect(guide?.faq.length).toBeGreaterThan(0);
    }
  });

  it('persists guideSeen locally and survives a new preferences instance', () => {
    const storage = new Map<string, string>();
    const fakeStorage: Storage = {
      get length() { return storage.size; },
      clear: () => storage.clear(),
      getItem: (key) => storage.get(key) ?? null,
      key: (index) => [...storage.keys()][index] ?? null,
      removeItem: (key) => void storage.delete(key),
      setItem: (key, value) => void storage.set(key, value),
    };
    const first = new LocalPreferences(fakeStorage);
    expect(first.hasSeenGuide('json-formatter')).toBe(false);
    first.markGuideSeen('json-formatter');
    expect(new LocalPreferences(fakeStorage).hasSeenGuide('json-formatter')).toBe(true);
  });
});
