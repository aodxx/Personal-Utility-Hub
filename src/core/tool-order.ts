import type { ToolMetadata } from './tool-contract';

export type ToolOrder = 'catalog' | 'frequent';

function isUsableTool(tool: ToolMetadata): boolean {
  return tool.status === 'active' || tool.status === 'beta';
}

export function mostUsedTools(
  tools: readonly ToolMetadata[],
  usage: Readonly<Record<string, number>>,
  fallbackIds: readonly string[],
  catalogOrder: readonly string[],
  limit = 5,
): ToolMetadata[] {
  const index = new Map(catalogOrder.map((id, position) => [id, position]));
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const eligible = tools.filter(isUsableTool);
  const hasUsage = eligible.some((tool) => (usage[tool.id] ?? 0) > 0);
  const source = hasUsage
    ? eligible
    : fallbackIds.map((id) => byId.get(id)).filter((tool): tool is ToolMetadata => Boolean(tool && isUsableTool(tool)));

  if (!hasUsage) return source.slice(0, limit);

  return [...source]
    .sort((left, right) => {
      const usageDifference = (usage[right.id] ?? 0) - (usage[left.id] ?? 0);
      if (usageDifference) return usageDifference;
      return (index.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (index.get(right.id) ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, limit);
}

export function orderTools(
  tools: readonly ToolMetadata[],
  order: ToolOrder,
  usage: Readonly<Record<string, number>>,
  catalogOrder: readonly string[],
): ToolMetadata[] {
  const index = new Map(catalogOrder.map((id, position) => [id, position]));
  return [...tools].sort((left, right) => {
    if (order === 'frequent') {
      const usageDifference = (usage[right.id] ?? 0) - (usage[left.id] ?? 0);
      if (usageDifference) return usageDifference;
    }
    return (index.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (index.get(right.id) ?? Number.MAX_SAFE_INTEGER);
  });
}
