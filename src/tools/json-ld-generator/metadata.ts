import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'json-ld-generator',
  title: 'JSON-LD Generator',
  description: 'สร้าง JSON-LD Schema สำหรับ Article, Product, Organization, FAQ และ Breadcrumb',
  category: 'Developer Tools',
  route: '/tools/json-ld-generator',
  icon: 'tool-json-ld-generator',
  tags: ['json-ld', 'schema', 'seo', 'structured data', 'developer', 'schema.org'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
