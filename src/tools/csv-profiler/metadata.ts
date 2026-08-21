import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'csv-profiler',
  title: 'CSV Data Cleaner & Profiler',
  description: 'Profile, clean and export CSV data privately in your browser.',
  category: 'ข้อความและข้อมูล',
  route: '/tools/csv-profiler',
  icon: 'tool-csv-profiler',
  tags: ['CSV', 'clean', 'profile', 'duplicates', 'data', 'ข้อมูล', 'ทำความสะอาด'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
};
