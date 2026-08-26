import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'jwt-inspector',
  title: 'JWT Inspector',
  description: 'Decode JWT headers, payloads and claims locally without verifying or uploading the token.',
  category: 'Developer Tools',
  route: '/tools/jwt-inspector',
  icon: 'tool-jwt-inspector',
  tags: ['jwt', 'token', 'json web token', 'claims', 'auth', 'developer', 'ตรวจสอบ token'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
