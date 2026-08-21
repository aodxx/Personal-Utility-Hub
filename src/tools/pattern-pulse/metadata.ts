import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'pattern-pulse',
  title: 'Pattern Pulse',
  description: 'เกมฝึกความจำที่เพิ่มลำดับสีทีละรอบ กดให้ถูกเพื่อทำคะแนนและสร้างสถิติส่วนตัวบนอุปกรณ์',
  category: 'เกม',
  route: '/tools/pattern-pulse',
  icon: 'tool-pattern-pulse',
  tags: ['game', 'memory', 'puzzle', 'touch', 'เกม', 'ฝึกความจำ'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
};
