import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'qr-reader',
  title: 'QR Code Reader',
  description: 'อ่าน QR Code จากรูปภาพหรือกล้องของอุปกรณ์แบบ Client-side',
  category: 'QR Code และบาร์โค้ด',
  route: '/tools/qr-reader',
  icon: 'tool-qr-reader',
  tags: ['qr', 'reader', 'scan', 'สแกน', 'กล้อง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
