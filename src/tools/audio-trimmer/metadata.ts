import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'audio-trimmer',
  title: 'Audio Trimmer',
  description: 'ตัดช่วงเสียง Preview และใส่ Fade โดยไม่อัปโหลดไฟล์ออกจากอุปกรณ์',
  category: 'เสียง',
  route: '/tools/audio-trimmer',
  icon: 'category-media',
  tags: ['audio', 'trim', 'cut', 'fade', 'waveform', 'mp3', 'wav', 'ตัดเสียง', 'เสียงเรียกเข้า'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
