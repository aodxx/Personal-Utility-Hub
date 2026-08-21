import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-resizer',
  title: 'Image Resizer',
  description: 'ปรับขนาดรูปภาพตามพิกเซลหรือสัดส่วน พร้อมดาวน์โหลดไฟล์ใหม่',
  category: 'รูปภาพ',
  route: '/tools/image-resizer',
  icon: 'tool-image-resize',
  tags: ['image', 'resize', 'รูปภาพ', 'ปรับขนาด', 'canvas'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
