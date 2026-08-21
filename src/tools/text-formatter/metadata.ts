import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'text-formatter',
  title: 'Text Formatter',
  description: 'จัดระเบียบข้อความ ลบช่องว่าง และแปลงรูปแบบตัวอักษรอย่างรวดเร็ว',
  category: 'ข้อความและข้อมูล',
  route: '/tools/text-formatter',
  icon: 'tool-text-format',
  tags: ['text', 'format', 'case', 'ข้อความ', 'ช่องว่าง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
