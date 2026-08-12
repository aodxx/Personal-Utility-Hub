import { metadata as base64Metadata } from '../tools/base64/metadata';
import { metadata as imageConverterMetadata } from '../tools/image-converter/metadata';
import { metadata as imageResizerMetadata } from '../tools/image-resizer/metadata';
import { metadata as jsonFormatterMetadata } from '../tools/json-formatter/metadata';
import { metadata as qrGeneratorMetadata } from '../tools/qr-generator/metadata';
import { metadata as qrReaderMetadata } from '../tools/qr-reader/metadata';
import { metadata as textFormatterMetadata } from '../tools/text-formatter/metadata';
import type { ToolMetadata } from '../core/tool-contract';

export const coreTools = [
  jsonFormatterMetadata,
  base64Metadata,
  textFormatterMetadata,
  qrGeneratorMetadata,
  imageResizerMetadata,
  imageConverterMetadata,
  qrReaderMetadata,
] as const satisfies readonly ToolMetadata[];
