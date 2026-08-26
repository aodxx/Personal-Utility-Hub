import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'hash-verifier',
  title: 'Hash & Checksum Verifier',
  description: 'Calculate and compare SHA-256, SHA-384 or SHA-512 hashes for text and files locally.',
  category: 'ไฟล์และข้อมูลเมตา',
  route: '/tools/hash-verifier',
  icon: 'tool-hash-verifier',
  tags: ['hash', 'checksum', 'sha256', 'sha384', 'sha512', 'integrity', 'file', 'ตรวจสอบไฟล์'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
