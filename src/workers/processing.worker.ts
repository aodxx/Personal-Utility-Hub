import { PDFDocument, type PDFImage } from 'pdf-lib';
import { trimPcm } from '../core/audio-processing';
import { MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS, SUPPORTED_IMAGE_TYPES } from '../core/image-processing';
import { MAX_PDF_PAGES, parsePageSelection } from '../core/file-processing';
import type {
  ImageProcessOptions,
  ProcessingJobKind,
  ProcessingPayloadMap,
  ProcessingRequest,
  ProcessingResponse,
  ProcessingResultMap,
} from '../core/processing-protocol';

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ProcessingRequest>) => void) | null;
  postMessage(message: ProcessingResponse, transfer?: Transferable[]): void;
};
const A4 = { width: 595.28, height: 841.89 } as const;
const PAGE_MARGIN = 24;

function report(jobId: string, progress: number, message: string): void {
  workerScope.postMessage({ type: 'progress', jobId, progress, message });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'ประมวลผลใน Web Worker ไม่สำเร็จ';
}

async function inspectPdf(file: File, jobId: string): Promise<ProcessingResultMap['pdf-inspect']> {
  report(jobId, 20, 'กำลังอ่านโครงสร้าง PDF');
  const document = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const pageCount = document.getPageCount();
  if (pageCount > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
  report(jobId, 100, 'อ่านข้อมูล PDF เสร็จแล้ว');
  return {
    pageCount,
    title: document.getTitle(),
    author: document.getAuthor(),
    subject: document.getSubject(),
    creator: document.getCreator(),
    producer: document.getProducer(),
  };
}

function fitPdfImage(image: PDFImage, pageWidth: number, pageHeight: number): { width: number; height: number; x: number; y: number } {
  const scale = Math.min((pageWidth - PAGE_MARGIN * 2) / image.width, (pageHeight - PAGE_MARGIN * 2) / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { width, height, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2 };
}

async function imageSource(file: File): Promise<{ bytes: ArrayBuffer; type: 'png' | 'jpg'; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      return { bytes: await file.arrayBuffer(), type: file.type === 'image/png' ? 'png' : 'jpg', width: bitmap.width, height: bitmap.height };
    }
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ไม่สามารถเปิด OffscreenCanvas ได้');
    context.drawImage(bitmap, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { bytes: await blob.arrayBuffer(), type: 'png', width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

async function imagesToPdf(files: File[], jobId: string): Promise<ProcessingResultMap['images-to-pdf']> {
  const output = await PDFDocument.create();
  output.setCreator('Personal Utility Hub');
  output.setProducer('pdf-lib');
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) continue;
    report(jobId, Math.round((index / files.length) * 80) + 5, `กำลังสร้างหน้า ${index + 1} จาก ${files.length}`);
    const source = await imageSource(file);
    const image = source.type === 'png' ? await output.embedPng(source.bytes) : await output.embedJpg(source.bytes);
    const landscape = source.width > source.height;
    const pageWidth = landscape ? A4.height : A4.width;
    const pageHeight = landscape ? A4.width : A4.height;
    const page = output.addPage([pageWidth, pageHeight]);
    page.drawImage(image, fitPdfImage(image, pageWidth, pageHeight));
  }
  report(jobId, 90, 'กำลังสร้าง PDF ผลลัพธ์');
  return { bytes: await output.save(), pageCount: files.length };
}

async function mergePdfs(files: File[], jobId: string): Promise<ProcessingResultMap['pdf-merge']> {
  const output = await PDFDocument.create();
  let pageCount = 0;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) continue;
    report(jobId, Math.round((index / files.length) * 80) + 5, `กำลังรวมไฟล์ ${index + 1} จาก ${files.length}`);
    const source = await PDFDocument.load(await file.arrayBuffer());
    pageCount += source.getPageCount();
    if (pageCount > MAX_PDF_PAGES) throw new Error(`รวมได้ไม่เกิน ${MAX_PDF_PAGES} หน้าในหนึ่งครั้ง`);
    const copied = await output.copyPages(source, source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
  }
  report(jobId, 90, 'กำลังสร้างไฟล์ PDF ผลลัพธ์');
  return { bytes: await output.save(), pageCount };
}

async function splitPdf(file: File, selection: string, jobId: string): Promise<ProcessingResultMap['pdf-split']> {
  report(jobId, 15, 'กำลังอ่านหน้า PDF');
  const source = await PDFDocument.load(await file.arrayBuffer());
  const totalPages = source.getPageCount();
  if (totalPages > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
  const selectedPages = parsePageSelection(selection, totalPages);
  report(jobId, 45, `กำลังคัดลอก ${selectedPages.length} หน้า`);
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, selectedPages);
  copied.forEach((page) => output.addPage(page));
  report(jobId, 90, 'กำลังสร้าง PDF ไฟล์ใหม่');
  return { bytes: await output.save(), selectedPages, totalPages };
}

async function trimAudio(pcm: ProcessingPayloadMap['audio-trim']['pcm'], options: ProcessingPayloadMap['audio-trim']['options'], jobId: string): Promise<ProcessingResultMap['audio-trim']> {
  return trimPcm(pcm, options, (progress, message) => report(jobId, progress, message));
}

async function sha256(file: File, jobId: string): Promise<ProcessingResultMap['sha256']> {
  report(jobId, 20, 'กำลังอ่านข้อมูลสำหรับ SHA-256');
  const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  report(jobId, 100, 'คำนวณ SHA-256 เสร็จแล้ว');
  return { value: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('') };
}

function imageDimensions(bitmap: ImageBitmap, options: ImageProcessOptions): { width: number; height: number } {
  if (options.width && options.height) return { width: options.width, height: options.height };
  const maxSide = options.maxSide ?? Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  return { width: Math.max(1, Math.round(bitmap.width * scale)), height: Math.max(1, Math.round(bitmap.height * scale)) };
}

async function processImage(file: File, options: ImageProcessOptions, jobId: string): Promise<ProcessingResultMap['image-process']> {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) throw new Error('รองรับเฉพาะไฟล์ PNG, JPEG และ WebP');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 15 MB');
  report(jobId, 15, 'กำลังถอดรหัสรูปภาพใน Worker');
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = imageDimensions(bitmap, options);
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
      throw new Error('ขนาดรูปภาพผลลัพธ์เกินขีดจำกัดบนอุปกรณ์');
    }
    report(jobId, 45, `กำลังประมวลผล ${width.toLocaleString()} × ${height.toLocaleString()} px`);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('ไม่สามารถเปิด OffscreenCanvas ได้');
    if (options.background) {
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);
    report(jobId, 80, 'กำลังเข้ารหัสไฟล์ผลลัพธ์');
    const blob = await canvas.convertToBlob({ type: options.type, quality: options.quality });
    report(jobId, 100, 'ประมวลผลรูปภาพเสร็จแล้ว');
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

async function execute<K extends ProcessingJobKind>(request: ProcessingRequest<K>): Promise<ProcessingResultMap[K]> {
  const { kind, payload, jobId } = request;
  if (kind === 'images-to-pdf') return imagesToPdf((payload as ProcessingPayloadMap['images-to-pdf']).files, jobId) as Promise<ProcessingResultMap[K]>;
  if (kind === 'pdf-inspect') return inspectPdf((payload as ProcessingPayloadMap['pdf-inspect']).file, jobId) as Promise<ProcessingResultMap[K]>;
  if (kind === 'pdf-merge') return mergePdfs((payload as ProcessingPayloadMap['pdf-merge']).files, jobId) as Promise<ProcessingResultMap[K]>;
  if (kind === 'pdf-split') {
    const value = payload as ProcessingPayloadMap['pdf-split'];
    return splitPdf(value.file, value.selection, jobId) as Promise<ProcessingResultMap[K]>;
  }
  if (kind === 'sha256') return sha256((payload as ProcessingPayloadMap['sha256']).file, jobId) as Promise<ProcessingResultMap[K]>;
  if (kind === 'audio-trim') {
    const value = payload as ProcessingPayloadMap['audio-trim'];
    return trimAudio(value.pcm, value.options, jobId) as Promise<ProcessingResultMap[K]>;
  }
  const value = payload as ProcessingPayloadMap['image-process'];
  return processImage(value.file, value.options, jobId) as Promise<ProcessingResultMap[K]>;
}

workerScope.onmessage = (event): void => {
  const request = event.data;
  void execute(request)
    .then((result) => {
      const transfer = 'bytes' in result && result.bytes instanceof Uint8Array ? [result.bytes.buffer] : undefined;
      workerScope.postMessage({ type: 'success', jobId: request.jobId, result }, transfer);
    })
    .catch((error: unknown) => workerScope.postMessage({ type: 'error', jobId: request.jobId, message: errorMessage(error) }));
};
