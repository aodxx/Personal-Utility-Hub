import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'svg-asset-studio',
  title: 'SVG Asset Studio',
  description: 'ค้นหา ตรวจสอบ sanitize แก้ไข optimize และเปรียบเทียบขนาด SVG แบบ local-first ก่อน export icon pack',
  category: 'รูปภาพ',
  route: '/tools/svg-asset-studio',
  icon: 'tool-svg-asset-studio',
  tags: ['svg', 'icon', 'library', 'sanitize', 'optimize', 'sprite', 'pack', 'css mask', 'developer'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.2.0-beta.1',
};
