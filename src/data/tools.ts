import { assertValidRegistry, type ToolRegistryEntry } from '../core/tool-contract';
import { foundationDemoMetadata } from '../tools/foundation-demo/metadata';

export const toolRegistry = [
  {
    metadata: foundationDemoMetadata,
    load: () => import('../tools/foundation-demo'),
  },
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);
