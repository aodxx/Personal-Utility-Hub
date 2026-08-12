import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'pdf-split',
  title: 'PDF Split',
  description: 'เลือกช่วงหน้าแล้วแยกออกเป็น PDF ใหม่โดยไม่ส่งเอกสารออกจากเครื่อง',
  category: 'PDF และเอกสาร',
  route: '/tools/pdf-split',
  icon: 'tool-pdf-split',
  tags: ['pdf', 'split', 'extract', 'แยก pdf', 'เลือกหน้า'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;

