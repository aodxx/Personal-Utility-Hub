import type { AppLocale } from './i18n';
import type { ToolOrder } from './tool-order';

export type ThemePreference = 'light' | 'dark';

export interface PortableSettings {
  schemaVersion: 1;
  exportedAt: string;
  preferences: {
    theme?: ThemePreference;
    locale: AppLocale;
    toolOrder: ToolOrder;
    favorites: string[];
    recent: string[];
    usage: Record<string, number>;
  };
}

const FAVORITES_KEY = 'utility-hub:favorites';
const RECENT_KEY = 'utility-hub:recent';
const THEME_KEY = 'utility-hub:theme';
const LOCALE_KEY = 'utility-hub:locale';
const TOOL_ORDER_KEY = 'utility-hub:tool-order';
const USAGE_KEY = 'utility-hub:usage';
const GUIDE_SEEN_KEY = 'utility-hub:guide-seen';
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

function parseUsage(value: string | null): Record<string, number> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => (
      typeof entry[1] === 'number' && Number.isSafeInteger(entry[1]) && entry[1] >= 0
    )));
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parsePortableSettings(value: string, allowedToolIds: ReadonlySet<string>): PortableSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TypeError('ไฟล์การตั้งค่าไม่ใช่ JSON ที่ถูกต้อง');
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !isRecord(parsed.preferences)) {
    throw new TypeError('รูปแบบไฟล์การตั้งค่าไม่รองรับ');
  }
  const preferences = parsed.preferences;
  const theme = preferences.theme;
  const locale = preferences.locale;
  const toolOrder = preferences.toolOrder;
  if (theme !== undefined && theme !== 'light' && theme !== 'dark') throw new TypeError('ค่า Theme ไม่ถูกต้อง');
  if (locale !== 'th' && locale !== 'en') throw new TypeError('ค่าภาษาไม่ถูกต้อง');
  if (toolOrder !== 'catalog' && toolOrder !== 'frequent') throw new TypeError('ค่าลำดับเครื่องมือไม่ถูกต้อง');

  const filterIds = (candidate: unknown, limit?: number): string[] => {
    if (!Array.isArray(candidate)) throw new TypeError('รายการเครื่องมือไม่ถูกต้อง');
    const ids = [...new Set(candidate.filter((id): id is string => typeof id === 'string' && allowedToolIds.has(id)))];
    return limit ? ids.slice(0, limit) : ids;
  };
  if (!isRecord(preferences.usage)) throw new TypeError('สถิติการใช้งานไม่ถูกต้อง');
  const usage = Object.fromEntries(Object.entries(preferences.usage).filter((entry): entry is [string, number] => (
    allowedToolIds.has(entry[0]) && typeof entry[1] === 'number' && Number.isSafeInteger(entry[1]) && entry[1] >= 0
  )));
  return {
    schemaVersion: 1,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date(0).toISOString(),
    preferences: {
      theme,
      locale,
      toolOrder,
      favorites: filterIds(preferences.favorites),
      recent: filterIds(preferences.recent, RECENT_LIMIT),
      usage,
    },
  };
}

export class LocalPreferences {
  private storage: Storage | undefined;
  private memoryFavorites = new Set<string>();
  private memoryRecent: string[] = [];
  private memoryTheme: ThemePreference | undefined;
  private memoryLocale: AppLocale = 'th';
  private memoryToolOrder: ToolOrder = 'catalog';
  private memoryUsage: Record<string, number> = {};
  private memoryGuideSeen = new Set<string>();

  constructor(storage?: Storage) {
    try {
      this.storage = storage ?? window.localStorage;
      this.memoryFavorites = new Set(parseStringArray(this.storage.getItem(FAVORITES_KEY)));
      this.memoryRecent = parseStringArray(this.storage.getItem(RECENT_KEY)).slice(0, RECENT_LIMIT);
      const theme = this.storage.getItem(THEME_KEY);
      this.memoryTheme = theme === 'light' || theme === 'dark' ? theme : undefined;
      const locale = this.storage.getItem(LOCALE_KEY);
      this.memoryLocale = locale === 'en' ? 'en' : 'th';
      const toolOrder = this.storage.getItem(TOOL_ORDER_KEY);
      this.memoryToolOrder = toolOrder === 'frequent' ? 'frequent' : 'catalog';
      this.memoryUsage = parseUsage(this.storage.getItem(USAGE_KEY));
      this.memoryGuideSeen = new Set(parseStringArray(this.storage.getItem(GUIDE_SEEN_KEY)));
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

  recordUse(toolId: string): number {
    const next = Math.min(Number.MAX_SAFE_INTEGER, (this.memoryUsage[toolId] ?? 0) + 1);
    this.memoryUsage = { ...this.memoryUsage, [toolId]: next };
    this.persistObject(USAGE_KEY, this.memoryUsage);
    return next;
  }

  getUsage(): Record<string, number> {
    return { ...this.memoryUsage };
  }

  hasSeenGuide(toolId: string): boolean {
    return this.memoryGuideSeen.has(toolId);
  }

  markGuideSeen(toolId: string): void {
    this.memoryGuideSeen.add(toolId);
    this.persist(GUIDE_SEEN_KEY, [...this.memoryGuideSeen]);
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

  getLocale(): AppLocale { return this.memoryLocale; }

  setLocale(locale: AppLocale): void {
    this.memoryLocale = locale;
    this.persistValue(LOCALE_KEY, locale);
  }

  getToolOrder(): ToolOrder { return this.memoryToolOrder; }

  setToolOrder(order: ToolOrder): void {
    this.memoryToolOrder = order;
    this.persistValue(TOOL_ORDER_KEY, order);
  }

  exportSettings(now = new Date()): PortableSettings {
    return {
      schemaVersion: 1,
      exportedAt: now.toISOString(),
      preferences: {
        theme: this.memoryTheme,
        locale: this.memoryLocale,
        toolOrder: this.memoryToolOrder,
        favorites: [...this.memoryFavorites],
        recent: [...this.memoryRecent],
        usage: { ...this.memoryUsage },
      },
    };
  }

  importSettings(settings: PortableSettings): void {
    this.memoryTheme = settings.preferences.theme;
    this.memoryLocale = settings.preferences.locale;
    this.memoryToolOrder = settings.preferences.toolOrder;
    this.memoryFavorites = new Set(settings.preferences.favorites);
    this.memoryRecent = settings.preferences.recent.slice(0, RECENT_LIMIT);
    this.memoryUsage = { ...settings.preferences.usage };
    this.persist(FAVORITES_KEY, [...this.memoryFavorites]);
    this.persist(RECENT_KEY, this.memoryRecent);
    this.persistObject(USAGE_KEY, this.memoryUsage);
    this.persistValue(LOCALE_KEY, this.memoryLocale);
    this.persistValue(TOOL_ORDER_KEY, this.memoryToolOrder);
    if (this.memoryTheme) this.persistValue(THEME_KEY, this.memoryTheme);
    else this.removeValue(THEME_KEY);
  }

  private persist(key: string, value: string[]): void {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch {
      this.storage = undefined;
    }
  }

  private persistObject(key: string, value: Record<string, number>): void {
    try { this.storage?.setItem(key, JSON.stringify(value)); } catch { this.storage = undefined; }
  }

  private persistValue(key: string, value: string): void {
    try { this.storage?.setItem(key, value); } catch { this.storage = undefined; }
  }

  private removeValue(key: string): void {
    try { this.storage?.removeItem(key); } catch { this.storage = undefined; }
  }
}
