import type { ToolMetadata } from './tool-contract';

export interface ToolFilters {
  query?: string;
  category?: string;
  favorites?: ReadonlySet<string>;
  favoritesOnly?: boolean;
}

export function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('th').trim().replace(/\s+/g, ' ');
}

export function filterTools(tools: readonly ToolMetadata[], filters: ToolFilters = {}): ToolMetadata[] {
  const query = normalizeSearchText(filters.query ?? '');
  const category = filters.category ?? 'ทั้งหมด';

  return tools.filter((tool) => {
    if (tool.status === 'disabled') return false;
    if (category !== 'ทั้งหมด' && tool.category !== category) return false;
    if (filters.favoritesOnly && !filters.favorites?.has(tool.id)) return false;
    if (!query) return true;

    const searchableText = normalizeSearchText([
      tool.title,
      tool.description,
      tool.category,
      ...tool.tags,
    ].join(' '));

    return searchableText.includes(query);
  });
}
