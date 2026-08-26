import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-watermark',
  title: 'Batch Image Watermark',
  description: 'ใส่ข้อความหรือลายน้ำลงบนรูปภาพหลายไฟล์ในเครื่อง พร้อมปรับตำแหน่งและความโปร่งใส',
  category: 'รูปภาพ',
  route: '/tools/image-watermark',
  icon: 'tool-image-watermark',
  tags: ['image', 'watermark', 'batch', 'logo', 'ลายน้ำ', 'รูปภาพ'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
