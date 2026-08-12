import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-converter',
  title: 'Image Converter',
  description: 'แปลงรูปภาพระหว่าง PNG, JPEG และ WebP ภายในอุปกรณ์',
  category: 'รูปภาพ',
  route: '/tools/image-converter',
  icon: 'tool-image-converter',
  tags: ['image', 'convert', 'png', 'jpeg', 'webp', 'แปลงรูป'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
