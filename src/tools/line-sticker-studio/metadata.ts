import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'line-sticker-studio',
  title: 'LINE Sticker Studio',
  description: 'เตรียมชุด LINE Sticker แบบ local-first: split, clean, edit, inspect, prompt และ export PNG/ZIP',
  category: 'รูปภาพ',
  route: '/tools/line-sticker-studio',
  icon: 'category-images',
  tags: ['image', 'line sticker', 'split', 'background cleanup', 'validator', 'zip', 'prompt'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'beta',
  version: '0.1.0',
} as const satisfies ToolMetadata;
