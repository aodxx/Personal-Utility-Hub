import type { ToolMetadata } from '../core/tool-contract';
import { metadata as fileMetadata } from '../tools/file-metadata/metadata';
import { metadata as imageCompressor } from '../tools/image-compressor/metadata';
import { metadata as imagesToPdf } from '../tools/images-to-pdf/metadata';
import { metadata as pdfMerge } from '../tools/pdf-merge/metadata';
import { metadata as pdfSplit } from '../tools/pdf-split/metadata';
import { metadata as pdfToImage } from '../tools/pdf-to-image/metadata';

export const fileTools = [
  imageCompressor,
  imagesToPdf,
  pdfMerge,
  pdfSplit,
  pdfToImage,
  fileMetadata,
] as const satisfies readonly ToolMetadata[];
