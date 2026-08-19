import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'url-query-builder',
  title: 'URL Query Builder',
  description: 'สร้าง URL query ใน browser',
  category: 'ข้อความและข้อมูล',
  route: '/tools/url-query-builder',
  icon: 'tool-url-query-builder',
  tags: ['url', 'query'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '1.0.0',
} as const satisfies ToolMetadata;
