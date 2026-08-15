import type { AudioPcmData, AudioTrimOptions, AudioTrimResult } from './audio-processing';
import type { SupportedImageType } from './image-processing';

export type ProcessingJobKind = 'images-to-pdf' | 'pdf-inspect' | 'pdf-merge' | 'pdf-split' | 'sha256' | 'image-process' | 'audio-trim';

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  maxSide?: number;
  quality: number;
  type: SupportedImageType;
  background?: string;
}

export interface PdfInfo {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
}

export interface ProcessingPayloadMap {
  'images-to-pdf': { files: File[] };
  'pdf-inspect': { file: File };
  'pdf-merge': { files: File[] };
  'pdf-split': { file: File; selection: string };
  sha256: { file: File };
  'image-process': { file: File; options: ImageProcessOptions };
  'audio-trim': { pcm: AudioPcmData; options: AudioTrimOptions };
}

export interface ProcessingResultMap {
  'images-to-pdf': { bytes: Uint8Array; pageCount: number };
  'pdf-inspect': PdfInfo;
  'pdf-merge': { bytes: Uint8Array; pageCount: number };
  'pdf-split': { bytes: Uint8Array; selectedPages: number[]; totalPages: number };
  sha256: { value: string };
  'image-process': { blob: Blob; width: number; height: number };
  'audio-trim': AudioTrimResult;
}

export interface ProcessingRequest<K extends ProcessingJobKind = ProcessingJobKind> {
  type: 'run';
  jobId: string;
  kind: K;
  payload: ProcessingPayloadMap[K];
}

export type ProcessingResponse =
  | { type: 'progress'; jobId: string; progress: number; message: string }
  | { type: 'success'; jobId: string; result: ProcessingResultMap[ProcessingJobKind] }
  | { type: 'error'; jobId: string; message: string };

export interface ProcessingJobOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number, message: string) => void;
}
