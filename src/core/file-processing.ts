export const MAX_PDF_BYTES = 40 * 1024 * 1024;
export const MAX_BATCH_BYTES = 40 * 1024 * 1024;
export const MAX_PDF_FILES = 10;
export const MAX_BATCH_IMAGES = 20;
export const MAX_PDF_PAGES = 200;
export const PDF_MIME_TYPE = 'application/pdf';

export function totalFileBytes(files: readonly File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

export function validateFileBatch(
  files: readonly File[],
  options: { maxFiles: number; maxBytes: number; acceptedTypes: readonly string[]; label: string },
): void {
  if (!files.length) throw new Error(`กรุณาเลือก${options.label}`);
  if (files.length > options.maxFiles) throw new Error(`เลือกได้ไม่เกิน ${options.maxFiles} ไฟล์ต่อครั้ง`);
  if (files.some((file) => file.size <= 0)) throw new Error('ไม่รองรับไฟล์ว่างเปล่า');
  if (files.some((file) => (
    !options.acceptedTypes.includes(file.type)
    && !(options.acceptedTypes.includes(PDF_MIME_TYPE) && /\.pdf$/i.test(file.name))
  ))) {
    throw new Error(`ชนิด${options.label}ไม่ถูกต้อง`);
  }
  if (totalFileBytes(files) > options.maxBytes) {
    throw new Error(`ขนาดไฟล์รวมต้องไม่เกิน ${Math.round(options.maxBytes / 1024 / 1024)} MB`);
  }
}

export function validatePdfFile(file: File): void {
  validateFileBatch([file], {
    maxFiles: 1,
    maxBytes: MAX_PDF_BYTES,
    acceptedTypes: [PDF_MIME_TYPE],
    label: 'ไฟล์ PDF',
  });
}

export function parsePageSelection(value: string, pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('จำนวนหน้า PDF ไม่ถูกต้อง');
  const text = value.trim();
  if (!text) throw new Error('กรุณาระบุหน้าที่ต้องการแยก เช่น 1-3,5');
  const pages: number[] = [];
  const seen = new Set<number>();

  for (const token of text.split(',')) {
    const part = token.trim();
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error(`รูปแบบช่วงหน้าไม่ถูกต้อง: ${part || '(ว่าง)'}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`ช่วงหน้า ${part} ต้องอยู่ระหว่าง 1 ถึง ${pageCount}`);
    }
    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        seen.add(page);
        pages.push(page - 1);
      }
    }
  }

  return pages;
}

export function replaceFileExtension(filename: string, suffix: string, extension: string): string {
  const basename = filename.replace(/\.[^.]+$/, '') || 'utility-hub-file';
  return `${basename}${suffix}.${extension.replace(/^\./, '')}`;
}

export function compressionSavingPercent(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0 || resultBytes < 0) return 0;
  return Math.round((1 - resultBytes / originalBytes) * 100);
}
