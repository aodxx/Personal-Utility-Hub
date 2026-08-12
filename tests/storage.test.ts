import { describe, expect, it } from 'vitest';
import { LocalPreferences } from '../src/core/storage';

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

    const restored = new LocalPreferences(storage);
    expect(restored.getFavorites()).toEqual(new Set(['json-formatter']));
    expect(restored.getRecent()).toEqual(['json-formatter', 'base64']);
    expect(restored.getTheme()).toBe('dark');
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
});
