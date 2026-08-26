import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'flowchart-studio',
  title: 'Flowchart Studio',
  description: 'สร้างแผนผังลำดับงานจากข้อความและ export เป็น SVG, PNG หรือ JSON ภายในเครื่อง',
  category: 'Developer Tools',
  route: '/tools/flowchart-studio',
  icon: 'tool-flowchart-studio',
  tags: ['flowchart', 'diagram', 'workflow', 'svg', 'developer', 'แผนผัง'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
