import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'svg-asset-studio',
  title: 'SVG Asset Studio',
  description: 'ค้นหา ตรวจสอบ แก้ไข sanitize optimize และสร้าง icon pack จาก SVG แบบ local-first',
  category: 'รูปภาพ',
  route: '/tools/svg-asset-studio',
  icon: 'image',
  tags: ['svg', 'icon', 'library', 'sanitize', 'optimize', 'sprite', 'pack', 'css mask', 'developer'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0-beta.1',
};
