import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'json-visualizer',
  title: 'ตัวแสดงผล JSON / JSON Visualizer',
  description: 'สำรวจ JSON แบบ tree และ graph พร้อมค้นหา ย่อ/ขยาย และ export เป็น SVG หรือ PNG ใน browser',
  category: 'ข้อความและข้อมูล',
  route: '/tools/json-visualizer',
  tags: ['json', 'visualizer', 'graph', 'tree', 'diagram', 'export', 'local'],
  icon: 'tool-json-visualizer',
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0',
} as const satisfies ToolMetadata;
