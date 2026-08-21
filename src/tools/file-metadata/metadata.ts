import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'file-metadata',
  title: 'File Metadata Viewer',
  description: 'ดูชื่อ ชนิด ขนาด วันที่ แฮช และข้อมูลเฉพาะของรูปภาพหรือ PDF',
  category: 'ไฟล์และข้อมูลเมตา',
  route: '/tools/file-metadata',
  icon: 'tool-file-metadata',
  tags: ['file', 'metadata', 'sha-256', 'ข้อมูลไฟล์', 'ขนาดไฟล์'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
