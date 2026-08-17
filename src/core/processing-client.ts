import { trimPcm } from './audio-processing';
import type {
  ImageProcessOptions,
  ProcessingJobKind,
  ProcessingJobOptions,
  ProcessingPayloadMap,
  ProcessingRequest,
  ProcessingResponse,
  ProcessingResultMap,
} from './processing-protocol';
import processingWorkerUrl from '../workers/processing.worker.ts?worker&url';

function abortError(): DOMException {
  return new DOMException('ยกเลิกการประมวลผลแล้ว', 'AbortError');
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

function canUseWorker(kind: ProcessingJobKind): boolean {
  if (typeof Worker !== 'function') return false;
  return !['image-process', 'images-to-pdf'].includes(kind) || typeof OffscreenCanvas === 'function';
}

export const PROCESSING_WORKER_URL = processingWorkerUrl;

async function runFallback<K extends ProcessingJobKind>(
  kind: K,
  payload: ProcessingPayloadMap[K],
  options: ProcessingJobOptions,
): Promise<ProcessingResultMap[K]> {
  assertNotAborted(options.signal);
  options.onProgress?.(10, 'กำลังเตรียมข้อมูลในอุปกรณ์');

  let result: ProcessingResultMap[ProcessingJobKind];
  if (kind === 'images-to-pdf') {
    const { imagesToPdf } = await import('./pdf-processing');
    const files = (payload as ProcessingPayloadMap['images-to-pdf']).files;
    result = { bytes: await imagesToPdf(files), pageCount: files.length };
  } else if (kind === 'pdf-inspect') {
    const { inspectPdf } = await import('./pdf-processing');
    result = await inspectPdf((payload as ProcessingPayloadMap['pdf-inspect']).file);
  } else if (kind === 'pdf-merge') {
    const { mergePdfs } = await import('./pdf-processing');
    result = await mergePdfs((payload as ProcessingPayloadMap['pdf-merge']).files);
  } else if (kind === 'pdf-split') {
    const { splitPdf } = await import('./pdf-processing');
    const splitPayload = payload as ProcessingPayloadMap['pdf-split'];
    result = await splitPdf(splitPayload.file, splitPayload.selection);
  } else if (kind === 'sha256') {
    const file = (payload as ProcessingPayloadMap['sha256']).file;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    result = { value: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('') };
  } else if (kind === 'audio-trim') {
    const audioPayload = payload as ProcessingPayloadMap['audio-trim'];
    result = await trimPcm(audioPayload.pcm, audioPayload.options, options.onProgress);
  } else if (kind === 'audio-process') {
    const audioPayload = payload as ProcessingPayloadMap['audio-process'];
    const { processAudio } = await import('./audio-processing');
    result = processAudio(audioPayload.pcm, audioPayload.operation, options.onProgress);
  } else {
    const { processImageOnMainThread } = await import('./image-processing');
    const imagePayload = payload as ProcessingPayloadMap['image-process'];
    result = await processImageOnMainThread(imagePayload.file, imagePayload.options);
  }

  assertNotAborted(options.signal);
  options.onProgress?.(100, 'ประมวลผลเสร็จแล้ว');
  return result as ProcessingResultMap[K];
}

export async function runProcessingJob<K extends ProcessingJobKind>(
  kind: K,
  payload: ProcessingPayloadMap[K],
  options: ProcessingJobOptions = {},
): Promise<ProcessingResultMap[K]> {
  assertNotAborted(options.signal);
  if (!canUseWorker(kind)) return runFallback(kind, payload, options);

  return new Promise<ProcessingResultMap[K]>((resolve, reject) => {
    const worker = new Worker(PROCESSING_WORKER_URL, { type: 'module' });
    const jobId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    let settled = false;

    const cleanup = (): void => {
      worker.terminate();
      options.signal?.removeEventListener('abort', handleAbort);
    };
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const handleAbort = (): void => finish(() => reject(abortError()));

    worker.onmessage = (event: MessageEvent<ProcessingResponse>): void => {
      const response = event.data;
      if (response.jobId !== jobId) return;
      if (response.type === 'progress') {
        options.onProgress?.(response.progress, response.message);
        return;
      }
      if (response.type === 'error') {
        finish(() => reject(new Error(response.message)));
        return;
      }
      finish(() => resolve(response.result as ProcessingResultMap[K]));
    };
    worker.onerror = (event): void => finish(() => reject(new Error(event.message || 'Web Worker ทำงานไม่สำเร็จ')));
    options.signal?.addEventListener('abort', handleAbort, { once: true });

    let requestPayload = payload;
    let transfer: Transferable[] = [];
    if (kind === 'audio-trim') {
      const source = (payload as ProcessingPayloadMap['audio-trim']).pcm;
      const pcm = { sampleRate: source.sampleRate, channels: source.channels.map((channel) => new Float32Array(channel)) };
      requestPayload = { ...(payload as ProcessingPayloadMap['audio-trim']), pcm } as ProcessingPayloadMap[K];
      transfer = pcm.channels.map((channel) => channel.buffer);
    } else if (kind === 'audio-process') {
      const audioPayload = payload as ProcessingPayloadMap['audio-process'];
      if (audioPayload.operation.kind !== 'merge') {
        const pcm = { sampleRate: audioPayload.pcm.sampleRate, channels: audioPayload.pcm.channels.map((channel) => new Float32Array(channel)) };
        requestPayload = { ...(audioPayload as ProcessingPayloadMap['audio-process']), pcm } as ProcessingPayloadMap[K];
        transfer = pcm.channels.map((channel) => channel.buffer);
      }
    }
    const request: ProcessingRequest<K> = { type: 'run', jobId, kind, payload: requestPayload };
    worker.postMessage(request, transfer);
  });
}

export const inspectPdfAsync = (file: File, options?: ProcessingJobOptions) => runProcessingJob('pdf-inspect', { file }, options);
export const imagesToPdfAsync = (files: File[], options?: ProcessingJobOptions) => runProcessingJob('images-to-pdf', { files }, options);
export const mergePdfsAsync = (files: File[], options?: ProcessingJobOptions) => runProcessingJob('pdf-merge', { files }, options);
export const splitPdfAsync = (file: File, selection: string, options?: ProcessingJobOptions) => runProcessingJob('pdf-split', { file, selection }, options);
export const sha256Async = async (file: File, options?: ProcessingJobOptions): Promise<string> => (await runProcessingJob('sha256', { file }, options)).value;
export const trimAudioAsync = (pcm: ProcessingPayloadMap['audio-trim']['pcm'], trimOptions: ProcessingPayloadMap['audio-trim']['options'], options?: ProcessingJobOptions) => runProcessingJob('audio-trim', { pcm, options: trimOptions }, options);
export const processAudioAsync = (pcm: ProcessingPayloadMap['audio-process']['pcm'], operation: ProcessingPayloadMap['audio-process']['operation'], options?: ProcessingJobOptions) => runProcessingJob('audio-process', { pcm, operation }, options);
export const processImageAsync = (file: File, imageOptions: ImageProcessOptions, options?: ProcessingJobOptions) => runProcessingJob('image-process', { file, options: imageOptions }, options);
