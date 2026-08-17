import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'community-mapping',
  title: 'Community Mapping Studio',
  description: 'สร้างแผนที่ข้อมูลชุมชนแบบ local-first ด้วยจุด เส้น พื้นที่ layers และ spatial analysis โดยไม่อัปโหลดพิกัด',
  category: 'ข้อมูลและไฟล์',
  route: '/tools/community-mapping',
  icon: 'map',
  tags: ['community', 'mapping', 'geodata', 'survey', 'farm', 'risk', 'offline', 'privacy'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0',
};
