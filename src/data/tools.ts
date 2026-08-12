import { assertValidRegistry, type ToolRegistryEntry } from '../core/tool-contract';
import { metadata as base64Metadata } from '../tools/base64/metadata';
import { foundationDemoMetadata } from '../tools/foundation-demo/metadata';
import { metadata as imageConverterMetadata } from '../tools/image-converter/metadata';
import { metadata as imageResizerMetadata } from '../tools/image-resizer/metadata';
import { metadata as jsonFormatterMetadata } from '../tools/json-formatter/metadata';
import { metadata as qrGeneratorMetadata } from '../tools/qr-generator/metadata';
import { metadata as qrReaderMetadata } from '../tools/qr-reader/metadata';
import { metadata as textFormatterMetadata } from '../tools/text-formatter/metadata';

export const toolRegistry = [
  {
    metadata: foundationDemoMetadata,
    load: () => import('../tools/foundation-demo'),
  },
  {
    metadata: jsonFormatterMetadata,
    load: () => import('../tools/json-formatter'),
  },
  {
    metadata: base64Metadata,
    load: () => import('../tools/base64'),
  },
  {
    metadata: textFormatterMetadata,
    load: () => import('../tools/text-formatter'),
  },
  {
    metadata: qrGeneratorMetadata,
    load: () => import('../tools/qr-generator'),
  },
  {
    metadata: imageResizerMetadata,
    load: () => import('../tools/image-resizer'),
  },
  {
    metadata: imageConverterMetadata,
    load: () => import('../tools/image-converter'),
  },
  {
    metadata: qrReaderMetadata,
    load: () => import('../tools/qr-reader'),
  },
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);

export const toolCatalog = toolRegistry.map(({ metadata }) => metadata);
