import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { MAX_PDF_PAGES, validatePdfFile } from './file-processing';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function getPdfPageCount(file: File): Promise<number> {
  validatePdfFile(file);
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdfDocument = await task.promise;
  try {
    if (pdfDocument.numPages > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
    return pdfDocument.numPages;
  } finally {
    await task.destroy();
  }
}

export async function renderPdfPage(
  file: File,
  pageNumber: number,
  scale: number,
  type: 'image/png' | 'image/jpeg',
  quality = 0.92,
): Promise<{ blob: Blob; width: number; height: number; pageCount: number }> {
  validatePdfFile(file);
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdfDocument = await task.promise;
  try {
    if (pdfDocument.numPages > MAX_PDF_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PDF_PAGES} หน้า`);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error(`หมายเลขหน้าต้องอยู่ระหว่าง 1 ถึง ${pdfDocument.numPages}`);
    }
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: type === 'image/png' });
    if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับเรนเดอร์ PDF ได้');
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('ไม่สามารถสร้างรูปภาพจาก PDF ได้')), type, quality);
    });
    return { blob, width: canvas.width, height: canvas.height, pageCount: pdfDocument.numPages };
  } finally {
    await task.destroy();
  }
}
