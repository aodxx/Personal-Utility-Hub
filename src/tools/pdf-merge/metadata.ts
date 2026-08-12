import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'pdf-merge',
  title: 'PDF Merge',
  description: 'รวม PDF หลายไฟล์เป็นเอกสารเดียวตามลำดับที่เลือกในเบราว์เซอร์',
  category: 'PDF และเอกสาร',
  route: '/tools/pdf-merge',
  icon: 'tool-pdf-merge',
  tags: ['pdf', 'merge', 'รวม pdf', 'เอกสาร'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
