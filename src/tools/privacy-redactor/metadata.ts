import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'privacy-redactor',
  title: 'Privacy Redactor Studio',
  description: 'Find and redact sensitive text locally before sharing a file.',
  category: 'ข้อความและข้อมูล',
  route: '/tools/privacy-redactor',
  icon: 'tool-privacy-redactor',
  tags: ['privacy', 'redact', 'PII', 'mask', 'text', 'ความเป็นส่วนตัว', 'ปิดบังข้อมูล'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
};
