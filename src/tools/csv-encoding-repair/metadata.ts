import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'csv-encoding-repair',
  title: 'CSV Thai Encoding Repair',
  description: 'ตรวจและซ่อมไฟล์ CSV ภาษาไทยที่แสดงเป็นภาษาต่างดาว พร้อม preview ก่อน export',
  category: 'ข้อความและข้อมูล',
  route: '/tools/csv-encoding-repair',
  icon: 'tool-csv-encoding-repair',
  tags: ['csv', 'encoding', 'utf-8', 'thai', 'excel', 'ภาษาต่างดาว', 'bom'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
