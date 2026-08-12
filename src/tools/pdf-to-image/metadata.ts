import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'pdf-to-image',
  title: 'PDF to Image',
  description: 'เรนเดอร์หน้าที่เลือกจาก PDF เป็น PNG หรือ JPEG ความละเอียดสูง',
  category: 'PDF และเอกสาร',
  route: '/tools/pdf-to-image',
  icon: 'tool-pdf-to-image',
  tags: ['pdf', 'image', 'png', 'jpeg', 'pdf เป็นรูป', 'แปลงหน้า'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;

