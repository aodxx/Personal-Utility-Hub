export type StickerMode = 'static' | 'animated';

export interface LineStickerPreset {
  id: string;
  mode: StickerMode;
  displayName: string;
  dimensions: { width: number; height: number; maxWidth?: number; maxHeight?: number };
  maxBytes: number;
  allowedFormats: readonly string[];
  requiredCounts: readonly number[];
  transparencyRequired: boolean;
  evenDimensionsRequired: boolean;
  minDpi: number;
  animation?: {
    minFrames: number;
    maxFrames: number;
    maxPlaybackSeconds: number;
    minLoops: number;
    maxLoops: number;
    maxDimension: { width: number; height: number };
  };
  sourceUrl: string;
  verifiedAt: string;
  notes: string;
}

const STATIC_SOURCE = 'https://creator.line.me/en/guideline/sticker/';
const ANIMATED_SOURCE = 'https://creator.line.me/en/guideline/animationsticker/';

export const LINE_STICKER_PRESETS: readonly LineStickerPreset[] = [
  {
    id: 'static-sticker',
    mode: 'static',
    displayName: 'Static Sticker Set',
    dimensions: { width: 370, height: 320, maxWidth: 370, maxHeight: 320 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png'],
    requiredCounts: [8, 16, 24, 32, 40],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    sourceUrl: STATIC_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'Technical preset based on the official Creation Guidelines; human review is not automatically verified.',
  },
  {
    id: 'main-image',
    mode: 'static',
    displayName: 'Main Image',
    dimensions: { width: 240, height: 240 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png'],
    requiredCounts: [1],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    sourceUrl: STATIC_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'Main image preset; transparency and technical checks are local checks only.',
  },
  {
    id: 'chat-thumbnail',
    mode: 'static',
    displayName: 'Chat Thumbnail Icon',
    dimensions: { width: 96, height: 74 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png'],
    requiredCounts: [1],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    sourceUrl: STATIC_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'LINE adds the animated play symbol for animated thumbnails; users should not draw it manually.',
  },
  {
    id: 'animated-sticker',
    mode: 'animated',
    displayName: 'Animated Sticker Preparation',
    dimensions: { width: 320, height: 270, maxWidth: 320, maxHeight: 270 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png', 'image/apng'],
    requiredCounts: [8, 16, 24],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    animation: {
      minFrames: 5,
      maxFrames: 20,
      maxPlaybackSeconds: 4,
      minLoops: 1,
      maxLoops: 4,
      maxDimension: { width: 320, height: 270 },
    },
    sourceUrl: ANIMATED_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'Frame preparation and validation are supported. APNG export remains partial until a verified local encoder is added.',
  },
  {
    id: 'animated-main-image',
    mode: 'animated',
    displayName: 'Animated Main Image',
    dimensions: { width: 240, height: 240 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png'],
    requiredCounts: [1],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    sourceUrl: ANIMATED_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'Static PNG main-image technical preset for animated sets.',
  },
  {
    id: 'animated-chat-thumbnail',
    mode: 'animated',
    displayName: 'Animated Chat Thumbnail Icon',
    dimensions: { width: 96, height: 74 },
    maxBytes: 1_000_000,
    allowedFormats: ['image/png'],
    requiredCounts: [1],
    transparencyRequired: true,
    evenDimensionsRequired: true,
    minDpi: 72,
    sourceUrl: ANIMATED_SOURCE,
    verifiedAt: '2026-08-17',
    notes: 'The play symbol is added by LINE and is not drawn by this tool.',
  },
];

export const STATIC_STICKER_PRESET = LINE_STICKER_PRESETS.find((preset) => preset.id === 'static-sticker')!;
export const MAIN_IMAGE_PRESET = LINE_STICKER_PRESETS.find((preset) => preset.id === 'main-image')!;
export const CHAT_THUMBNAIL_PRESET = LINE_STICKER_PRESETS.find((preset) => preset.id === 'chat-thumbnail')!;
export const ANIMATED_STICKER_PRESET = LINE_STICKER_PRESETS.find((preset) => preset.id === 'animated-sticker')!;
