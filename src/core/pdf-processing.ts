import { PDFDocument, StandardFonts, degrees, rgb, type PDFImage } from 'pdf-lib';
import { canvasToBlob, loadImageBitmap, renderBitmap, type SupportedImageType } from './image-processing';
import { MAX_PDF_PAGES, parsePageSelection, validatePdfFile } from './file-processing';
export { bytesToPdfBlob } from './file-processing';

const A4 = { width: 595.28, height: 841.89 } as const;
const PAGE_MARGIN = 24;

async function imageBytesForPdf(file: File): Promise<{ bytes: ArrayBuffer; type: 'png' | 'jpg'; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      return {
        bytes: await file.arrayBuffer(),
        type: file.type === 'image/png' ? 'png' : 'jpg',
        width: bitmap.width,
        height: bitmap.height,
      };
    }
    const canvas = renderBitmap(bitmap, { width: bitmap.width, height: bitmap.height });
    const blob = await canvasToBlob(canvas, 'image/png');
    return { bytes: await blob.arrayBuffer(), type: 'png', width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
function fitImage(image: PDFImage, pageWidth: number, pageHeight: number): { width: number; height: number; x: number; y: number } {
  const availableWidth = pageWidth - PAGE_MARGIN * 2;
  const availableHeight = pageHeight - PAGE_MARGIN * 2;
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { width, height, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2 };
}

export async function imagesToPdf(files: readonly File[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  output.setCreator('Personal Utility Hub');
  output.setProducer('pdf-lib');

  for (const file of files) {
    const source = await imageBytesForPdf(file);
    const image = source.type === 'png'
      ? await output.embedPng(source.bytes)
      : await output.embedJpg(source.bytes);
    const landscape = source.width > source.height;
    const pageWidth = landscape ? A4.height : A4.width;
    const pageHeight = landscape ? A4.width : A4.height;
    const page = output.addPage([pageWidth, pageHeight]);
    page.drawImage(image, fitImage(image, pageWidth, pageHeight));
  }

  return output.save();
}

export async function mergePdfs(files: readonly File[]): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const output = await PDFDocument.create();
  let pageCount = 0;
  for (const file of files) {
    validatePdfFile(file);
    const source = await PDFDocument.load(await file.arrayBuffer());
    pageCount += source.getPageCount();
    if (pageCount > MAX_PDF_PAGES) throw new Error(`รวมได้ไม่เกิน ${MAX_PDF_PAGES} หน้าในหนึ่งครั้ง`);
    const copied = await output.copyPages(source, source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
  }
  return { bytes: await output.save(), pageCount };
}

export async function inspectPdf(file: File): Promise<{ pageCount: number; title?: string; author?: string; subject?: string; creator?: string; producer?: string }> {
  validatePdfFile(file);
  const document = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  return {
    pageCount: document.getPageCount(),
    title: document.getTitle(),
    author: document.getAuthor(),
    subject: document.getSubject(),
    creator: document.getCreator(),
    producer: document.getProducer(),
  };
}

export async function splitPdf(file: File, selection: string): Promise<{ bytes: Uint8Array; selectedPages: number[]; totalPages: number }> {
  validatePdfFile(file);
  const source = await PDFDocument.load(await file.arrayBuffer());
  const totalPages = source.getPageCount();
  if (totalPages > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
  const selectedPages = parsePageSelection(selection, totalPages);
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, selectedPages);
  copied.forEach((page) => output.addPage(page));
  return { bytes: await output.save(), selectedPages, totalPages };
}

export function parsePageOrder(value: string, pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('จำนวนหน้า PDF ไม่ถูกต้อง');
  if (!value.trim()) return Array.from({ length: pageCount }, (_, index) => index);
  const result = value.split(',').map((part) => Number(part.trim()));
  if (result.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    throw new Error(`ลำดับหน้าต้องอยู่ระหว่าง 1 ถึง ${pageCount}`);
  }
  if (new Set(result).size !== result.length) throw new Error('ลำดับหน้าห้ามซ้ำกัน');
  if (!result.length) throw new Error('กรุณาระบุลำดับหน้า PDF');
  return result.map((page) => page - 1);
}

export interface PdfOrganizerOptions {
  order: number[];
  rotations?: Record<number, number>;
  addPageNumbers?: boolean;
  watermark?: string;
}

export async function organizePdf(file: File, options: PdfOrganizerOptions): Promise<{ bytes: Uint8Array; pageCount: number }> {
  validatePdfFile(file);
  const source = await PDFDocument.load(await file.arrayBuffer());
  const totalPages = source.getPageCount();
  if (totalPages > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
  if (!options.order.length || options.order.some((index) => index < 0 || index >= totalPages) || new Set(options.order).size !== options.order.length) {
    throw new Error('ลำดับหน้า PDF ไม่ถูกต้อง');
  }
  const output = await PDFDocument.create();
  output.setCreator('Personal Utility Hub');
  output.setProducer('pdf-lib');
  const copied = await output.copyPages(source, options.order);
  copied.forEach((page) => output.addPage(page));
  const font = await output.embedFont(StandardFonts.Helvetica);
  const pageCount = copied.length;
  copied.forEach((page, index) => {
    const originalIndex = options.order[index] ?? index;
    const rotation = options.rotations?.[originalIndex];
    if (rotation !== undefined) page.setRotation(degrees(((rotation % 360) + 360) % 360));
    if (options.addPageNumbers) {
      page.drawText(`${index + 1} / ${pageCount}`, { x: 24, y: 18, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
    }
    const watermark = options.watermark?.trim();
    if (watermark) {
      const size = Math.min(32, Math.max(16, page.getWidth() / Math.max(12, watermark.length)));
      const textWidth = font.widthOfTextAtSize(watermark, size);
      page.drawText(watermark, {
        x: (page.getWidth() - textWidth) / 2,
        y: page.getHeight() / 2,
        size,
        font,
        rotate: degrees(35),
        color: rgb(0.45, 0.45, 0.45),
        opacity: 0.18,
      });
    }
  });
  return { bytes: await output.save(), pageCount };
}

export async function compressImage(
  file: File,
  options: { maxSide: number; quality: number; type: Exclude<SupportedImageType, 'image/png'> },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    const scale = Math.min(1, options.maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = renderBitmap(bitmap, { width, height }, options.type === 'image/jpeg' ? '#ffffff' : undefined);
    const blob = await canvasToBlob(canvas, options.type, options.quality);
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}
