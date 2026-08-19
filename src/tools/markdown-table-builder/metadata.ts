import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'markdown-table-builder',
  title: 'Markdown Table Builder',
  description: 'แปลง CSV, TSV หรือข้อมูลคั่นด้วย pipe เป็น Markdown table',
  category: 'ข้อความและข้อมูล',
  route: '/tools/markdown-table-builder',
  icon: 'tool-markdown-table-builder',
  tags: ['markdown', 'table', 'csv', 'tsv', 'text'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '1.0.0',
} as const satisfies ToolMetadata;
