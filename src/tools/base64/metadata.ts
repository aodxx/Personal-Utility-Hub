import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'base64',
  title: 'Base64 Encoder / Decoder',
  description: 'เข้ารหัสและถอดรหัสข้อความ Unicode หรือข้อมูล Base64 ภายในเบราว์เซอร์',
  category: 'ข้อความและข้อมูล',
  route: '/tools/base64',
  icon: 'tool-base64',
  tags: ['base64', 'encode', 'decode', 'unicode', 'เข้ารหัส', 'ถอดรหัส'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
