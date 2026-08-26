import type { ToolMetadata } from '../core/tool-contract';
import { metadata as audioCompressor } from '../tools/audio-compressor/metadata';
import { metadata as audioFinisher } from '../tools/audio-finisher/metadata';
import { metadata as audioMerger } from '../tools/audio-merger/metadata';
import { metadata as audioSpeedPitch } from '../tools/audio-speed-pitch/metadata';
import { metadata as audioTrimmer } from '../tools/audio-trimmer/metadata';
import { metadata as silenceRemover } from '../tools/silence-remover/metadata';
import { metadata as privacyRedactor } from '../tools/privacy-redactor/metadata';
import { metadata as fileDiff } from '../tools/file-diff/metadata';
import { metadata as imageContactSheet } from '../tools/image-contact-sheet/metadata';
import { metadata as csvProfiler } from '../tools/csv-profiler/metadata';
import { metadata as audioChapterMarker } from '../tools/audio-chapter-marker/metadata';
import { metadata as fileMetadata } from '../tools/file-metadata/metadata';
import { metadata as imageCompressor } from '../tools/image-compressor/metadata';
import { metadata as imageBlur } from '../tools/image-blur/metadata';
import { metadata as pdfOrganizer } from '../tools/pdf-organizer/metadata';
import { metadata as csvEncodingRepair } from '../tools/csv-encoding-repair/metadata';
import { metadata as imageWatermark } from '../tools/image-watermark/metadata';
import { metadata as imageCrop } from '../tools/image-crop/metadata';
import { metadata as imagesToPdf } from '../tools/images-to-pdf/metadata';
import { metadata as pdfMerge } from '../tools/pdf-merge/metadata';
import { metadata as pdfSplit } from '../tools/pdf-split/metadata';
import { metadata as pdfToImage } from '../tools/pdf-to-image/metadata';
import { metadata as hashVerifier } from '../tools/hash-verifier/metadata';

export const fileTools = [
  audioTrimmer,
  audioCompressor,
  audioMerger,
  silenceRemover,
  audioFinisher,
  audioSpeedPitch,
  privacyRedactor,
  fileDiff,
  imageContactSheet,
  csvProfiler,
  audioChapterMarker,
  imageCompressor,
  imageBlur,
  pdfOrganizer,
  csvEncodingRepair,
  imageWatermark,
  imageCrop,
  imagesToPdf,
  pdfMerge,
  pdfSplit,
  pdfToImage,
  fileMetadata,
  hashVerifier,
] as const satisfies readonly ToolMetadata[];
