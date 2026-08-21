import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'land-measurement',
  title: 'วัดระยะและพื้นที่แปลง',
  description: 'วัดระยะและพื้นที่แปลงจากแผนที่หรือ GPS พร้อมหน่วยไทย',
  category: 'แผนที่และภูมิสารสนเทศ',
  route: '/tools/land-measurement',
  icon: 'category-location',
  tags: ['วัดที่ดิน', 'วัดพื้นที่', 'ไร่', 'GPS', 'พิกัด', 'แผนที่'],
  processing: 'client-side',
  supportsOffline: false,
  requiresFile: false,
  status: 'beta',
  version: '1.0.0',
};
