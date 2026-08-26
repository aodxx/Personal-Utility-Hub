import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-crop',
  title: 'Circle & Rounded Crop',
  description: 'ครอบรูปเป็นวงกลมหรือขอบมน พร้อมพื้นหลังโปร่งใสและดาวน์โหลดในเครื่อง',
  category: 'รูปภาพ',
  route: '/tools/image-crop',
  icon: 'tool-image-crop',
  tags: ['image', 'crop', 'circle', 'rounded', 'avatar', 'โปร่งใส', 'ขอบมน'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
