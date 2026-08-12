export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export interface Dimensions {
  width: number;
  height: number;
}

export function validateImageFile(file: File): void {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    throw new Error('รองรับเฉพาะไฟล์ PNG, JPEG และ WebP');
  }
  if (file.size <= 0) throw new Error('ไฟล์รูปภาพว่างเปล่า');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 15 MB');
}

export function validateDimensions({ width, height }: Dimensions): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('ความกว้างและความสูงต้องเป็นจำนวนเต็มตั้งแต่ 1 พิกเซล');
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`แต่ละด้านต้องไม่เกิน ${MAX_IMAGE_DIMENSION.toLocaleString()} พิกเซล`);
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    throw new Error('รูปผลลัพธ์ต้องมีจำนวนพิกเซลรวมไม่เกิน 24 ล้านพิกเซล');
  }
}

export function proportionalHeight(source: Dimensions, targetWidth: number): number {
  if (source.width <= 0 || source.height <= 0) throw new Error('ขนาดรูปภาพต้นฉบับไม่ถูกต้อง');
  return Math.max(1, Math.round((targetWidth / source.width) * source.height));
}

export function fitWithin(source: Dimensions, maxSide: number): Dimensions {
  validateDimensions(source);
  if (!Number.isFinite(maxSide) || maxSide < 1) throw new Error('ขนาดด้านสูงสุดไม่ถูกต้อง');
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  validateImageFile(file);
  if (typeof createImageBitmap !== 'function') throw new Error('เบราว์เซอร์นี้ไม่รองรับการประมวลผลรูปภาพแบบ Local');
  const bitmap = await createImageBitmap(file);
  try {
    validateDimensions({ width: bitmap.width, height: bitmap.height });
  } catch (error) {
    bitmap.close();
    throw error;
  }
  return bitmap;
}

export function renderBitmap(bitmap: ImageBitmap, dimensions: Dimensions, background?: string): HTMLCanvasElement {
  validateDimensions(dimensions);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับประมวลผลรูปภาพได้');
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, dimensions.width, dimensions.height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: SupportedImageType, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('เบราว์เซอร์ไม่สามารถสร้างไฟล์รูปภาพผลลัพธ์ได้')),
      type,
      quality,
    );
  });
}

export async function processImageOnMainThread(
  file: File,
  options: { width?: number; height?: number; maxSide?: number; quality: number; type: SupportedImageType; background?: string },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    const dimensions = options.width && options.height
      ? { width: options.width, height: options.height }
      : fitWithin({ width: bitmap.width, height: bitmap.height }, options.maxSide ?? Math.max(bitmap.width, bitmap.height));
    const canvas = renderBitmap(bitmap, dimensions, options.background);
    return { blob: await canvasToBlob(canvas, options.type, options.quality), ...dimensions };
  } finally {
    bitmap.close();
  }
}

export function extensionForType(type: SupportedImageType): string {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  return 'png';
}
