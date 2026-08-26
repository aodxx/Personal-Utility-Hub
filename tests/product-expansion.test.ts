import { describe, expect, it } from 'vitest';
import { compatibilityFromEnvironment, requiredCompatibilityReady } from '../src/core/compatibility';
import { localizeCategory, localizeTool, t } from '../src/core/i18n';
import { orderTools } from '../src/core/tool-order';
import { toolCatalog } from '../src/data/tools';

describe('Phase 5 product expansion', () => {
  it('localizes shared UI, categories and tool metadata', () => {
    expect(t('en', 'settingsTitle')).toBe('Settings and local data');
    expect(localizeCategory('รูปภาพ', 'en')).toBe('Images');
    const compressor = toolCatalog.find(({ id }) => id === 'image-compressor');
    if (!compressor) throw new Error('missing tool');
    expect(localizeTool(compressor, 'en')).toMatchObject({ title: 'Image Compressor', category: 'Images' });
  });

  it('orders most-used tools first and keeps registry order for ties', () => {
    const tools = toolCatalog.filter(({ id }) => ['foundation-demo', 'json-formatter', 'base64', 'text-formatter'].includes(id));
    const ordered = orderTools(tools, 'frequent', { base64: 4, 'text-formatter': 4, 'json-formatter': 1 }, tools.map(({ id }) => id));
    expect(ordered.map(({ id }) => id)).toEqual(['base64', 'text-formatter', 'json-formatter', 'foundation-demo']);
    expect(orderTools(tools, 'catalog', { base64: 99 }, tools.map(({ id }) => id))).toEqual(tools);
  });

  it('distinguishes required compatibility from optional enhancements', () => {
    const ready = compatibilityFromEnvironment({ serviceWorker: false, indexedDb: false, worker: true, canvas: true, fileApi: true, clipboard: false, camera: false });
    expect(requiredCompatibilityReady(ready)).toBe(true);
    const blocked = compatibilityFromEnvironment({ serviceWorker: true, indexedDb: true, worker: false, canvas: true, fileApi: true, clipboard: true, camera: true });
    expect(requiredCompatibilityReady(blocked)).toBe(false);
  });
});
