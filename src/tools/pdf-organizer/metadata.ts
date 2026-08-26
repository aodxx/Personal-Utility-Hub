import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'pdf-organizer',
  title: 'PDF Page Organizer',
  description: 'ลบ หมุน จัดเรียง ใส่เลขหน้า และใส่ลายน้ำ PDF ภายในเบราว์เซอร์',
  category: 'PDF และเอกสาร',
  route: '/tools/pdf-organizer',
  icon: 'tool-pdf-organizer',
  tags: ['pdf', 'pages', 'organize', 'rotate', 'watermark', 'เลขหน้า', 'จัดเรียง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
