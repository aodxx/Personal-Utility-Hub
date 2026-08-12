export type ThemePreference = 'light' | 'dark';

const FAVORITES_KEY = 'utility-hub:favorites';
const RECENT_KEY = 'utility-hub:recent';
const THEME_KEY = 'utility-hub:theme';
const RECENT_LIMIT = 6;

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export class LocalPreferences {
  private storage: Storage | undefined;
  private memoryFavorites = new Set<string>();
  private memoryRecent: string[] = [];
  private memoryTheme: ThemePreference | undefined;

  constructor(storage?: Storage) {
    try {
      this.storage = storage ?? window.localStorage;
      this.memoryFavorites = new Set(parseStringArray(this.storage.getItem(FAVORITES_KEY)));
      this.memoryRecent = parseStringArray(this.storage.getItem(RECENT_KEY)).slice(0, RECENT_LIMIT);
      const theme = this.storage.getItem(THEME_KEY);
      this.memoryTheme = theme === 'light' || theme === 'dark' ? theme : undefined;
    } catch {
      this.storage = undefined;
    }
  }

  getFavorites(): Set<string> {
    return new Set(this.memoryFavorites);
  }

  toggleFavorite(toolId: string): boolean {
    const isFavorite = !this.memoryFavorites.has(toolId);
    if (isFavorite) this.memoryFavorites.add(toolId);
    else this.memoryFavorites.delete(toolId);
    this.persist(FAVORITES_KEY, [...this.memoryFavorites]);
    return isFavorite;
  }

  getRecent(): string[] {
    return [...this.memoryRecent];
  }

  addRecent(toolId: string): void {
    this.memoryRecent = [toolId, ...this.memoryRecent.filter((id) => id !== toolId)].slice(0, RECENT_LIMIT);
    this.persist(RECENT_KEY, this.memoryRecent);
  }

  clearRecent(): void {
    this.memoryRecent = [];
    this.persist(RECENT_KEY, this.memoryRecent);
  }

  getTheme(): ThemePreference | undefined {
    return this.memoryTheme;
  }

  setTheme(theme: ThemePreference): void {
    this.memoryTheme = theme;
    try {
      this.storage?.setItem(THEME_KEY, theme);
    } catch {
      this.storage = undefined;
    }
  }

  private persist(key: string, value: string[]): void {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch {
      this.storage = undefined;
    }
  }
}
