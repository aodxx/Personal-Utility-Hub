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
import { metadata as communityMappingMetadata } from '../tools/community-mapping/metadata';
import { metadata as orbitCatcherMetadata } from '../tools/orbit-catcher/metadata';
import { metadata as patternPulseMetadata } from '../tools/pattern-pulse/metadata';
import { metadata as landMeasurementMetadata } from '../tools/land-measurement/metadata';
import { svgAssetManifest } from './svg-assets/manifest';
import { metadata as silenceRemoverMetadata } from '../tools/silence-remover/metadata';
import { metadata as base64Metadata } from '../tools/base64/metadata';
import { foundationDemoMetadata } from '../tools/foundation-demo/metadata';
import { metadata as imageConverterMetadata } from '../tools/image-converter/metadata';
import { metadata as imageResizerMetadata } from '../tools/image-resizer/metadata';
import { metadata as jsonFormatterMetadata } from '../tools/json-formatter/metadata';
import { metadata as dataFormatConverterMetadata } from '../tools/data-format-converter/metadata';
import { metadata as jsonVisualizerMetadata } from '../tools/json-visualizer/metadata';
import { metadata as qrGeneratorMetadata } from '../tools/qr-generator/metadata';
import { metadata as qrReaderMetadata } from '../tools/qr-reader/metadata';
import { metadata as textFormatterMetadata } from '../tools/text-formatter/metadata';
import { metadata as urlQueryBuilderMetadata } from '../tools/url-query-builder/metadata';
import { metadata as jsonSchemaGeneratorMetadata } from '../tools/json-schema-generator/metadata';
import { metadata as markdownTableBuilderMetadata } from '../tools/markdown-table-builder/metadata';
import { metadata as fileMetadata } from '../tools/file-metadata/metadata';
import { metadata as imageCompressorMetadata } from '../tools/image-compressor/metadata';
import { metadata as imageBlurMetadata } from '../tools/image-blur/metadata';
import { metadata as imagesToPdfMetadata } from '../tools/images-to-pdf/metadata';
import { metadata as pdfMergeMetadata } from '../tools/pdf-merge/metadata';
import { metadata as pdfSplitMetadata } from '../tools/pdf-split/metadata';
import { metadata as pdfToImageMetadata } from '../tools/pdf-to-image/metadata';
import { metadata as pdfOrganizerMetadata } from '../tools/pdf-organizer/metadata';
import { metadata as csvEncodingRepairMetadata } from '../tools/csv-encoding-repair/metadata';
import { metadata as jsonI18nMapperMetadata } from '../tools/json-i18n-mapper/metadata';
import { metadata as imageWatermarkMetadata } from '../tools/image-watermark/metadata';
import { metadata as jsonLdGeneratorMetadata } from '../tools/json-ld-generator/metadata';
import { metadata as flowchartStudioMetadata } from '../tools/flowchart-studio/metadata';
import { metadata as imageCropMetadata } from '../tools/image-crop/metadata';
import { metadata as jwtInspectorMetadata } from '../tools/jwt-inspector/metadata';
import { metadata as hashVerifierMetadata } from '../tools/hash-verifier/metadata';
import { metadata as regexPlaygroundMetadata } from '../tools/regex-playground/metadata';
import { metadata as colorContrastMetadata } from '../tools/color-contrast/metadata';

const svgLibraryAssets = async (): Promise<readonly string[]> => svgAssetManifest.map(({ assetUrl }) => assetUrl);

const processingWorkerAssets = async (): Promise<readonly string[]> => {
  const { PROCESSING_WORKER_URL } = await import('../core/processing-client');
  return [PROCESSING_WORKER_URL];
};

const regexWorkerAssets = async (): Promise<readonly string[]> => {
  const { REGEX_WORKER_URL } = await import('../core/regex-processing-client');
  return [REGEX_WORKER_URL];
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
    metadata: dataFormatConverterMetadata,
    load: () => import('../tools/data-format-converter'),
  },
  {
    metadata: jsonVisualizerMetadata,
    load: () => import('../tools/json-visualizer'),
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
    metadata: urlQueryBuilderMetadata,
    load: () => import('../tools/url-query-builder'),
  },
  {
    metadata: jsonSchemaGeneratorMetadata,
    load: () => import('../tools/json-schema-generator'),
  },
  {
    metadata: markdownTableBuilderMetadata,
    load: () => import('../tools/markdown-table-builder'),
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
    metadata: imageBlurMetadata,
    load: () => import('../tools/image-blur'),
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
  { metadata: pdfOrganizerMetadata, load: () => import('../tools/pdf-organizer') },
  { metadata: fileMetadata, load: () => import('../tools/file-metadata'), prepareOffline: processingWorkerAssets },
  { metadata: csvEncodingRepairMetadata, load: () => import('../tools/csv-encoding-repair') },
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
  { metadata: imageWatermarkMetadata, load: () => import('../tools/image-watermark') },
  { metadata: imageCropMetadata, load: () => import('../tools/image-crop') },
  { metadata: jwtInspectorMetadata, load: () => import('../tools/jwt-inspector') },
  { metadata: hashVerifierMetadata, load: () => import('../tools/hash-verifier'), prepareOffline: processingWorkerAssets },
  { metadata: regexPlaygroundMetadata, load: () => import('../tools/regex-playground'), prepareOffline: regexWorkerAssets },
  { metadata: colorContrastMetadata, load: () => import('../tools/color-contrast') },
  { metadata: jsonI18nMapperMetadata, load: () => import('../tools/json-i18n-mapper') },
  { metadata: jsonLdGeneratorMetadata, load: () => import('../tools/json-ld-generator') },
  { metadata: flowchartStudioMetadata, load: () => import('../tools/flowchart-studio') },
  {
    metadata: lineStickerStudioMetadata,
    load: () => import('../tools/line-sticker-studio'),
    prepareOffline: processingWorkerAssets,
  },
  { metadata: svgAssetStudioMetadata, load: () => import('../tools/svg-asset-studio'), prepareOffline: svgLibraryAssets },
  { metadata: audioChapterMarkerMetadata, load: () => import('../tools/audio-chapter-marker') },
  { metadata: communityMappingMetadata, load: () => import('../tools/community-mapping') },
  { metadata: orbitCatcherMetadata, load: () => import('../tools/orbit-catcher') },
  { metadata: patternPulseMetadata, load: () => import('../tools/pattern-pulse') },
  { metadata: landMeasurementMetadata, load: () => import('../tools/land-measurement') },
] satisfies readonly ToolRegistryEntry[];

assertValidRegistry(toolRegistry);

export const toolCatalog = toolRegistry.map(({ metadata }) => metadata);
/** Public catalog excludes the internal lifecycle diagnostic from the end-user Hub. */
export const publicToolCatalog = toolCatalog.filter(({ id }) => id !== 'foundation-demo');
