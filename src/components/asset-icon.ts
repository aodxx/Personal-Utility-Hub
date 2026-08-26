export const visualAssetIds = [
  'category-all',
  'category-images',
  'category-documents',
  'category-text-data',
  'category-qr-barcode',
  'category-media',
  'category-location',
  'category-files',
  'category-diagrams',
  'category-games',
  'category-fortune',
  'category-developer',
  'category-other',
  'tool-json-formatter',
  'tool-base64',
  'tool-text-formatter',
  'tool-text-format',
  'tool-qr-generator',
  'tool-qr-reader',
  'tool-image-resizer',
  'tool-image-resize',
  'tool-image-converter',
  'tool-image-compressor',
  'tool-image-blur',
  'tool-images-to-pdf',
  'tool-pdf-merge',
  'tool-pdf-split',
  'tool-pdf-to-image',
  'tool-file-metadata',
  'tool-file-inspector',
  'tool-foundation-demo',
  'tool-json-schema-generator',
  'tool-markdown-table-builder',
  'tool-url-query-builder',
  'tool-line-sticker-studio',
  'tool-svg-asset-studio',
  'tool-community-mapping',
  'tool-orbit-catcher',
  'tool-pattern-pulse',
  'tool-audio-trimmer',
  'tool-audio-compressor',
  'tool-audio-finisher',
  'tool-audio-merger',
  'tool-audio-speed-pitch',
  'tool-silence-remover',
  'tool-csv-profiler',
  'tool-file-diff',
  'tool-privacy-redactor',
  'tool-audio-chapter-marker',
  'tool-image-contact-sheet',
  'tool-pdf-organizer',
  'tool-csv-encoding-repair',
  'tool-json-i18n-mapper',
  'tool-image-watermark',
  'tool-json-ld-generator',
  'tool-flowchart-studio',
  'tool-image-crop',
] as const;

export type VisualAssetId = (typeof visualAssetIds)[number];

export function isVisualAssetId(value: string | undefined): value is VisualAssetId {
  return visualAssetIds.includes(value as VisualAssetId);
}

export function assetIcon(id: VisualAssetId, className = ''): string {
  const classes = ['asset-icon', className].filter(Boolean).join(' ');
  const spriteUrl = `${import.meta.env.BASE_URL}icons/utility-3d-icons.svg?v=0.9.0-all-tools#${id}`;

  return `<svg class="${classes}" aria-hidden="true" focusable="false"><use href="${spriteUrl}"></use></svg>`;
}

export function toolAssetIcon(icon: string | undefined, className = '', fallback = '◇'): string {
  return isVisualAssetId(icon)
    ? assetIcon(icon, ['asset-icon--tool', className].filter(Boolean).join(' '))
    : `<span class="asset-icon-fallback${className ? ` ${className}` : ''}" aria-hidden="true">${fallback}</span>`;
}
