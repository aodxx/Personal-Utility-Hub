import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'regex-playground',
  title: 'Regex Playground',
  description: 'Test regular expressions with matches, capture groups and replacement preview in your browser.',
  category: 'Developer Tools',
  route: '/tools/regex-playground',
  icon: 'tool-regex-playground',
  tags: ['regex', 'regular expression', 'pattern', 'developer', 'จับคู่ข้อความ', 'ทดสอบ pattern'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
