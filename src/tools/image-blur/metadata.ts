import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'image-blur',
  title: 'Image Blur & Sensor',
  description: 'เบลอหรือทำพิกเซลเซนเซอร์เฉพาะจุดบนรูปภาพ โดยไม่อัปโหลดไฟล์',
  category: 'รูปภาพ',
  route: '/tools/image-blur',
  icon: 'tool-image-blur',
  tags: ['image', 'blur', 'pixelate', 'censor', 'privacy', 'เบลอ', 'เซนเซอร์', 'ปิดบัง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
