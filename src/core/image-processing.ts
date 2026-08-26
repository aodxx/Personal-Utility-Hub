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

export type RedactionEffect = 'blur' | 'pixelate';

export interface RedactionPoint {
  x: number;
  y: number;
}

export interface RedactionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageRedactionOptions {
  region: RedactionRegion;
  effect: RedactionEffect;
  strength: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRedactionRegion(start: RedactionPoint, end: RedactionPoint, dimensions: Dimensions): RedactionRegion {
  validateDimensions(dimensions);
  const startX = clamp(Math.min(start.x, end.x), 0, dimensions.width);
  const startY = clamp(Math.min(start.y, end.y), 0, dimensions.height);
  const endX = clamp(Math.max(start.x, end.x), 0, dimensions.width);
  const endY = clamp(Math.max(start.y, end.y), 0, dimensions.height);
  const region = {
    x: Math.floor(startX),
    y: Math.floor(startY),
    width: Math.max(1, Math.ceil(endX - startX)),
    height: Math.max(1, Math.ceil(endY - startY)),
  };
  validateRedactionRegion(region, dimensions);
  return region;
}

export function validateRedactionRegion(region: RedactionRegion, dimensions: Dimensions): void {
  validateDimensions(dimensions);
  if (![region.x, region.y, region.width, region.height].every(Number.isInteger)) {
    throw new Error('กรอบเซนเซอร์ต้องเป็นจำนวนเต็ม');
  }
  if (region.width < 1 || region.height < 1) throw new Error('กรอบเซนเซอร์ต้องมีขนาดอย่างน้อย 1 พิกเซล');
  if (region.x < 0 || region.y < 0 || region.x + region.width > dimensions.width || region.y + region.height > dimensions.height) {
    throw new Error('กรอบเซนเซอร์ต้องอยู่ภายในรูปภาพ');
  }
}

export function validateRedactionOptions(options: ImageRedactionOptions, dimensions: Dimensions): void {
  validateRedactionRegion(options.region, dimensions);
  if (options.effect !== 'blur' && options.effect !== 'pixelate') throw new Error('รูปแบบเซนเซอร์ไม่ถูกต้อง');
  if (!Number.isFinite(options.strength) || options.strength < 2 || options.strength > 64) {
    throw new Error('ความแรงของเอฟเฟกต์ต้องอยู่ระหว่าง 2 ถึง 64');
  }
}

type ImageRenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function renderRedaction(
  context: ImageRenderContext,
  bitmap: CanvasImageSource,
  dimensions: Dimensions,
  options: ImageRedactionOptions,
): void {
  validateRedactionOptions(options, dimensions);
  context.clearRect(0, 0, dimensions.width, dimensions.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
  const { x, y, width, height } = options.region;
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  if (options.effect === 'blur') {
    context.filter = `blur(${Math.round(options.strength)}px)`;
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
  } else {
    const imageData = context.getImageData(x, y, width, height);
    const pixelSize = Math.max(2, Math.round(options.strength));
    context.imageSmoothingEnabled = false;
    for (let blockY = 0; blockY < height; blockY += pixelSize) {
      for (let blockX = 0; blockX < width; blockX += pixelSize) {
        const sampleX = Math.min(width - 1, blockX + Math.floor(Math.min(pixelSize, width - blockX) / 2));
        const sampleY = Math.min(height - 1, blockY + Math.floor(Math.min(pixelSize, height - blockY) / 2));
        const offset = (sampleY * width + sampleX) * 4;
        const red = imageData.data[offset] ?? 0;
        const green = imageData.data[offset + 1] ?? 0;
        const blue = imageData.data[offset + 2] ?? 0;
        const alpha = (imageData.data[offset + 3] ?? 255) / 255;
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        context.fillRect(x + blockX, y + blockY, Math.min(pixelSize, width - blockX), Math.min(pixelSize, height - blockY));
      }
    }
  }
  context.restore();
  context.filter = 'none';
}

export async function processImageRedactionOnMainThread(
  file: File,
  options: ImageRedactionOptions & { quality: number; type: SupportedImageType },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    const dimensions = { width: bitmap.width, height: bitmap.height };
    validateRedactionOptions(options, dimensions);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับเซนเซอร์รูปภาพได้');
    renderRedaction(context, bitmap, dimensions, options);
    return { blob: await canvasToBlob(canvas, options.type, options.quality), ...dimensions };
  } finally {
    bitmap.close();
  }
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

export type WatermarkPosition = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';

export async function processImageWatermarkOnMainThread(
  file: File,
  options: { text: string; opacity: number; scale: number; position: WatermarkPosition; quality: number; type: SupportedImageType },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    if (!options.text.trim()) throw new Error('กรุณาระบุข้อความลายน้ำ');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับลายน้ำได้');
    context.drawImage(bitmap, 0, 0);
    const size = Math.max(12, Math.round(Math.min(canvas.width, canvas.height) * 0.06 * options.scale));
    const margin = Math.max(12, Math.round(size * 0.7));
    context.font = `700 ${size}px sans-serif`;
    context.textBaseline = 'middle';
    const width = context.measureText(options.text.trim()).width;
    const positions: Record<WatermarkPosition, [number, number]> = {
      'top-left': [margin, margin],
      'top-right': [canvas.width - margin - width, margin],
      center: [(canvas.width - width) / 2, canvas.height / 2],
      'bottom-left': [margin, canvas.height - margin],
      'bottom-right': [canvas.width - margin - width, canvas.height - margin],
    };
    const [x, y] = positions[options.position];
    context.save();
    context.globalAlpha = Math.min(1, Math.max(0.05, options.opacity));
    context.fillStyle = '#ffffff';
    context.shadowColor = 'rgba(0,0,0,.55)';
    context.shadowBlur = Math.max(2, size * 0.12);
    context.fillText(options.text.trim(), x, y);
    context.restore();
    return { blob: await canvasToBlob(canvas, options.type, options.quality), width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}

export type CropShape = 'circle' | 'rounded';

export async function processImageCropOnMainThread(
  file: File,
  options: { shape: CropShape; radius: number; outputSize: number; quality: number; type: SupportedImageType },
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await loadImageBitmap(file);
  try {
    const size = Math.min(options.outputSize, bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับ crop ได้');
    const sx = Math.floor((bitmap.width - size) / 2);
    const sy = Math.floor((bitmap.height - size) / 2);
    context.save();
    context.beginPath();
    if (options.shape === 'circle') context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else {
      const radius = Math.min(size / 2, Math.max(0, options.radius));
      if (typeof context.roundRect === 'function') context.roundRect(0, 0, size, size, radius);
      else {
        context.moveTo(radius, 0);
        context.lineTo(size - radius, 0);
        context.arcTo(size, 0, size, radius, radius);
        context.lineTo(size, size - radius);
        context.arcTo(size, size, size - radius, size, radius);
        context.lineTo(radius, size);
        context.arcTo(0, size, 0, size - radius, radius);
        context.lineTo(0, radius);
        context.arcTo(0, 0, radius, 0, radius);
        context.closePath();
      }
    }
    context.clip();
    context.drawImage(bitmap, sx, sy, size, size, 0, 0, size, size);
    context.restore();
    return { blob: await canvasToBlob(canvas, options.type, options.quality), width: size, height: size };
  } finally {
    bitmap.close();
  }
}

export function extensionForType(type: SupportedImageType): string {
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/webp') return 'webp';
  return 'png';
}
