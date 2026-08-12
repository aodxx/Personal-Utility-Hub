import { assertValidRegistry, type ToolRegistryEntry } from '../core/tool-contract';
import { foundationDemoMetadata } from '../tools/foundation-demo/metadata';
import { plannedTools } from './planned-tools';

export const toolRegistry = [
  {
    metadata: foundationDemoMetadata,
    load: () => import('../tools/foundation-demo'),
  },
  ...plannedTools.map((metadata) => ({
    metadata,
    load: async () => {
      const { createPlannedTool } = await import('../tools/planned-tool');
      return createPlannedTool(metadata);
    },
  })),
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);

export const toolCatalog = toolRegistry.map(({ metadata }) => metadata);
