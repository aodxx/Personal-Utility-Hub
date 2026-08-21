import type { ToolMetadata } from '../../core/tool-contract';

export const foundationDemoMetadata: ToolMetadata = {
  id: 'foundation-demo',
  title: 'Foundation Lifecycle Demo',
  description: 'เครื่องมือภายในสำหรับยืนยันการโหลดแบบ Lazy และวงจร mount/unmount ของ Hub Core',
  category: 'Developer Tools',
  route: '/tools/foundation-demo',
  icon: 'tool-foundation-demo',
  tags: ['foundation', 'lifecycle', 'demo'],
  processing: 'client-side',
  supportsOffline: false,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0',
};
