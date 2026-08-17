import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'file-diff',
  title: 'File Diff & Change Map',
  description: 'Compare text or JSON versions and export a readable change report locally.',
  category: 'ข้อความและข้อมูล',
  route: '/tools/file-diff',
  icon: 'tool-text-formatter',
  tags: ['diff', 'compare', 'JSON', 'changes', 'เปรียบเทียบ', 'การเปลี่ยนแปลง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
};
