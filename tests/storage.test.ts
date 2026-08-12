import { describe, expect, it } from 'vitest';
import { LocalPreferences, parsePortableSettings } from '../src/core/storage';

describe('local preferences', () => {
  it('stores favorites, recent tools and theme', () => {
    const storage = window.localStorage;
    storage.clear();
    const preferences = new LocalPreferences(storage);
    expect(preferences.toggleFavorite('json-formatter')).toBe(true);
    preferences.addRecent('json-formatter');
    preferences.addRecent('base64');
    preferences.addRecent('json-formatter');
    preferences.setTheme('dark');
    preferences.setLocale('en');
    preferences.setToolOrder('frequent');
    preferences.recordUse('base64');
    preferences.recordUse('base64');

    const restored = new LocalPreferences(storage);
    expect(restored.getFavorites()).toEqual(new Set(['json-formatter']));
    expect(restored.getRecent()).toEqual(['json-formatter', 'base64']);
    expect(restored.getTheme()).toBe('dark');
    expect(restored.getLocale()).toBe('en');
    expect(restored.getToolOrder()).toBe('frequent');
    expect(restored.getUsage()).toEqual({ base64: 2 });
  });

  it('continues in memory when storage fails', () => {
    const unavailableStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } satisfies Storage;
    const preferences = new LocalPreferences(unavailableStorage);
    preferences.toggleFavorite('base64');
    preferences.addRecent('base64');
    expect(preferences.getFavorites()).toEqual(new Set(['base64']));
    expect(preferences.getRecent()).toEqual(['base64']);
  });

  it('exports, validates and imports a versioned portable settings file', () => {
    const storage = window.localStorage;
    storage.clear();
    const source = new LocalPreferences(storage);
    source.toggleFavorite('json-formatter');
    source.addRecent('base64');
    source.recordUse('base64');
    source.setLocale('en');
    source.setToolOrder('frequent');
    const exported = source.exportSettings(new Date('2026-08-12T00:00:00.000Z'));
    const parsed = parsePortableSettings(JSON.stringify(exported), new Set(['json-formatter', 'base64']));

    storage.clear();
    const target = new LocalPreferences(storage);
    target.importSettings(parsed);
    expect(target.getLocale()).toBe('en');
    expect(target.getToolOrder()).toBe('frequent');
    expect(target.getFavorites()).toEqual(new Set(['json-formatter']));
    expect(target.getRecent()).toEqual(['base64']);
    expect(target.getUsage()).toEqual({ base64: 1 });
  });

  it('rejects invalid or unsupported settings files', () => {
    expect(() => parsePortableSettings('{broken', new Set())).toThrow('JSON');
    expect(() => parsePortableSettings(JSON.stringify({ schemaVersion: 2, preferences: {} }), new Set())).toThrow('ไม่รองรับ');
  });
});
