import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'json-formatter',
  title: 'JSON Formatter / Validator',
  description: 'จัดรูปแบบ ตรวจสอบ และอ่านข้อผิดพลาดของ JSON ได้ง่ายขึ้น',
  category: 'Developer Tools',
  route: '/tools/json-formatter',
  icon: 'tool-json-formatter',
  tags: ['json', 'format', 'validator', 'developer', 'จัดรูปแบบ'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
