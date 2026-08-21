import type { VisualAssetId } from '../components/asset-icon';

export const categoryVisuals = {
  'ทั้งหมด': 'category-all',
  'รูปภาพ': 'category-images',
  'PDF และเอกสาร': 'category-documents',
  'ข้อความและข้อมูล': 'category-text-data',
  'QR Code และบาร์โค้ด': 'category-qr-barcode',
  'เสียงและดนตรี': 'category-media',
  'แผนที่และภูมิสารสนเทศ': 'category-location',
  'ไฟล์และข้อมูลเมตา': 'category-files',
  'ไดอะแกรม': 'category-diagrams',
  'เกม': 'category-games',
  'ดูดวง': 'category-fortune',
  'Developer Tools': 'category-developer',
  'อื่น ๆ': 'category-other',
} as const satisfies Record<string, VisualAssetId>;

export type CategoryWithVisual = keyof typeof categoryVisuals;
