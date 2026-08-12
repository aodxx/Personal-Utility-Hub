import type { ToolMetadata } from './tool-contract';

export type ToolOrder = 'catalog' | 'frequent';

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
