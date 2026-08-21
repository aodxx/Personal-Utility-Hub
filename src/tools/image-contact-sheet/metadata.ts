import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'image-contact-sheet',
  title: 'Image Contact Sheet Studio',
  description: 'Create labeled image contact sheets and catalogs without uploading your photos.',
  category: 'รูปภาพ',
  route: '/tools/image-contact-sheet',
  icon: 'tool-image-contact-sheet',
  tags: ['contact sheet', 'catalog', 'photos', 'grid', 'รูปภาพ', 'แคตตาล็อก'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
};
