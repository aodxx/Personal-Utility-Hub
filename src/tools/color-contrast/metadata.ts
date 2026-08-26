import type { ToolMetadata } from '../../core/tool-contract';

export const metadata = {
  id: 'color-contrast',
  title: 'Color Contrast Checker',
  description: 'Check WCAG contrast ratios for text and interface colors locally with a live preview.',
  category: 'Developer Tools',
  route: '/tools/color-contrast',
  icon: 'tool-color-contrast',
  tags: ['color', 'contrast', 'wcag', 'accessibility', 'a11y', 'design', 'ตรวจสอบสี'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
