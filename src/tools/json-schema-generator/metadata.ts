import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'json-schema-generator',
  title: 'JSON Schema Generator',
  description: 'สร้าง JSON Schema จากตัวอย่าง JSON ใน browser',
  category: 'ข้อความและข้อมูล',
  route: '/tools/json-schema-generator',
  icon: 'tool-json-schema-generator',
  tags: ['json', 'schema', 'validation', 'developer'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '1.0.0',
} as const satisfies ToolMetadata;
