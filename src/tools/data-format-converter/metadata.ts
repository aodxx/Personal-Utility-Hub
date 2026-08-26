import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'data-format-converter',
  title: 'Data Format Converter',
  description: 'แปลง JSON, YAML, TOML และ XML ใน browser',
  category: 'ข้อความและข้อมูล',
  route: '/tools/data-format-converter',
  icon: 'tool-data-format-converter',
  tags: ['json', 'yaml', 'toml', 'xml', 'convert', 'validate', 'data'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0',
} as const satisfies ToolMetadata;
