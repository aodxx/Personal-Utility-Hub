import { assertValidRegistry, type ToolRegistryEntry } from '../core/tool-contract';
import { metadata as base64Metadata } from '../tools/base64/metadata';
import { foundationDemoMetadata } from '../tools/foundation-demo/metadata';
import { metadata as imageConverterMetadata } from '../tools/image-converter/metadata';
import { metadata as imageResizerMetadata } from '../tools/image-resizer/metadata';
import { metadata as jsonFormatterMetadata } from '../tools/json-formatter/metadata';
import { metadata as qrGeneratorMetadata } from '../tools/qr-generator/metadata';
import { metadata as qrReaderMetadata } from '../tools/qr-reader/metadata';
import { metadata as textFormatterMetadata } from '../tools/text-formatter/metadata';
import { metadata as fileMetadata } from '../tools/file-metadata/metadata';
import { metadata as imageCompressorMetadata } from '../tools/image-compressor/metadata';
import { metadata as imagesToPdfMetadata } from '../tools/images-to-pdf/metadata';
import { metadata as pdfMergeMetadata } from '../tools/pdf-merge/metadata';
import { metadata as pdfSplitMetadata } from '../tools/pdf-split/metadata';
import { metadata as pdfToImageMetadata } from '../tools/pdf-to-image/metadata';

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
  {
    metadata: imageCompressorMetadata,
    load: () => import('../tools/image-compressor'),
  },
  {
    metadata: imagesToPdfMetadata,
    load: () => import('../tools/images-to-pdf'),
  },
  {
    metadata: pdfMergeMetadata,
    load: () => import('../tools/pdf-merge'),
  },
  {
    metadata: pdfSplitMetadata,
    load: () => import('../tools/pdf-split'),
  },
  {
    metadata: pdfToImageMetadata,
    load: () => import('../tools/pdf-to-image'),
  },
  {
    metadata: fileMetadata,
    load: () => import('../tools/file-metadata'),
  },
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);

export const toolCatalog = toolRegistry.map(({ metadata }) => metadata);
