import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'images-to-pdf',
  title: 'Images to PDF',
  description: 'รวมรูปภาพสูงสุด 20 ไฟล์เป็น PDF ขนาด A4 ตามลำดับที่เลือก',
  category: 'PDF และเอกสาร',
  route: '/tools/images-to-pdf',
  icon: 'tool-images-to-pdf',
  tags: ['image', 'pdf', 'รูปเป็น pdf', 'รวมรูป', 'เอกสาร'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
