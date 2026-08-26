import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'json-i18n-mapper',
  title: 'JSON i18n Mapper',
  description: 'เปรียบเทียบ key ของไฟล์แปลภาษา JSON และสร้างแผนที่ key ที่ขาดหรือเกิน',
  category: 'Developer Tools',
  route: '/tools/json-i18n-mapper',
  icon: 'tool-json-i18n-mapper',
  tags: ['json', 'i18n', 'localization', 'translation', 'developer', 'ภาษา'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
