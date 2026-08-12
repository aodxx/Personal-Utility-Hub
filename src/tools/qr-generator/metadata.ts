import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'qr-generator',
  title: 'QR Code Generator',
  description: 'สร้าง QR Code จากข้อความหรือลิงก์โดยไม่ส่งข้อมูลไปยังเซิร์ฟเวอร์',
  category: 'QR Code และบาร์โค้ด',
  route: '/tools/qr-generator',
  icon: 'tool-qr-generator',
  tags: ['qr', 'generator', 'สร้างคิวอาร์', 'ลิงก์'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
