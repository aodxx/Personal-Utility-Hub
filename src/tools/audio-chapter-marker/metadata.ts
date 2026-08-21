import type { ToolMetadata } from '../../core/tool-contract';

export const metadata: ToolMetadata = {
  id: 'audio-chapter-marker',
  title: 'Audio Chapter Marker & Cue Sheet',
  description: 'Mark chapters on a local waveform and export cue sheets for podcasts and lectures.',
  category: 'เสียงและดนตรี',
  route: '/tools/audio-chapter-marker',
  icon: 'tool-audio-chapter-marker',
  tags: ['audio', 'chapters', 'cue sheet', 'podcast', 'markers', 'chapter', 'พอดแคสต์'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: true,
  status: 'active',
  version: '1.0.0',
};
