import { assertValidRegistry, type ToolRegistryEntry } from '../core/tool-contract';
import { metadata as audioCompressorMetadata } from '../tools/audio-compressor/metadata';
import { metadata as audioFinisherMetadata } from '../tools/audio-finisher/metadata';
import { metadata as audioMergerMetadata } from '../tools/audio-merger/metadata';
import { metadata as audioSpeedPitchMetadata } from '../tools/audio-speed-pitch/metadata';
import { metadata as audioTrimmerMetadata } from '../tools/audio-trimmer/metadata';
import { metadata as privacyRedactorMetadata } from '../tools/privacy-redactor/metadata';
import { metadata as fileDiffMetadata } from '../tools/file-diff/metadata';
import { metadata as imageContactSheetMetadata } from '../tools/image-contact-sheet/metadata';
import { metadata as lineStickerStudioMetadata } from '../tools/line-sticker-studio/metadata';
import { metadata as svgAssetStudioMetadata } from '../tools/svg-asset-studio/metadata';
import { metadata as csvProfilerMetadata } from '../tools/csv-profiler/metadata';
import { metadata as audioChapterMarkerMetadata } from '../tools/audio-chapter-marker/metadata';
import { metadata as silenceRemoverMetadata } from '../tools/silence-remover/metadata';
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

const processingWorkerAssets = async (): Promise<readonly string[]> => {
  const { PROCESSING_WORKER_URL } = await import('../core/processing-client');
  return [PROCESSING_WORKER_URL];
};

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
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: imageConverterMetadata,
    load: () => import('../tools/image-converter'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: qrReaderMetadata,
    load: () => import('../tools/qr-reader'),
  },
  {
    metadata: imageCompressorMetadata,
    load: () => import('../tools/image-compressor'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: imagesToPdfMetadata,
    load: () => import('../tools/images-to-pdf'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: pdfMergeMetadata,
    load: () => import('../tools/pdf-merge'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: pdfSplitMetadata,
    load: () => import('../tools/pdf-split'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: pdfToImageMetadata,
    load: () => import('../tools/pdf-to-image'),
    prepareOffline: async () => {
      const { PDF_RENDERING_WORKER_URL } = await import('../core/pdf-rendering');
      return [PDF_RENDERING_WORKER_URL];
    },
  },
  {
    metadata: fileMetadata,
    load: () => import('../tools/file-metadata'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: audioTrimmerMetadata,
    load: () => import('../tools/audio-trimmer'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: audioCompressorMetadata,
    load: () => import('../tools/audio-compressor'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: audioMergerMetadata,
    load: () => import('../tools/audio-merger'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: silenceRemoverMetadata,
    load: () => import('../tools/silence-remover'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: audioFinisherMetadata,
    load: () => import('../tools/audio-finisher'),
    prepareOffline: processingWorkerAssets,
  },
  {
    metadata: audioSpeedPitchMetadata,
    load: () => import('../tools/audio-speed-pitch'),
    prepareOffline: processingWorkerAssets,
  },
  { metadata: privacyRedactorMetadata, load: () => import('../tools/privacy-redactor') },
  { metadata: fileDiffMetadata, load: () => import('../tools/file-diff') },
  { metadata: imageContactSheetMetadata, load: () => import('../tools/image-contact-sheet') },
  { metadata: csvProfilerMetadata, load: () => import('../tools/csv-profiler') },
  {
    metadata: lineStickerStudioMetadata,
    load: () => import('../tools/line-sticker-studio'),
    prepareOffline: processingWorkerAssets,
  },
  { metadata: svgAssetStudioMetadata, load: () => import('../tools/svg-asset-studio') },
  { metadata: audioChapterMarkerMetadata, load: () => import('../tools/audio-chapter-marker') },
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);

export const toolCatalog = toolRegistry.map(({ metadata }) => metadata);
