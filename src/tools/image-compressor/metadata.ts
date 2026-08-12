import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-compressor',
  title: 'Image Compressor',
  description: 'ลดขนาดไฟล์รูปภาพ ปรับคุณภาพและด้านยาวสูงสุด โดยไม่อัปโหลดไฟล์',
  category: 'รูปภาพ',
  route: '/tools/image-compressor',
  icon: 'tool-image-compressor',
  tags: ['image', 'compress', 'webp', 'jpeg', 'บีบอัด', 'ลดขนาด'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
