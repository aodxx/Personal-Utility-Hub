export const visualAssetIds = [
  'category-all',
  'category-images',
  'category-documents',
  'category-text-data',
  'category-qr-barcode',
  'category-media',
  'category-developer',
  'category-other',
  'tool-json-formatter',
  'tool-base64',
  'tool-text-formatter',
  'tool-qr-generator',
  'tool-qr-reader',
  'tool-image-resizer',
  'tool-image-converter',
] as const;

export type VisualAssetId = (typeof visualAssetIds)[number];

export function isVisualAssetId(value: string | undefined): value is VisualAssetId {
  return visualAssetIds.includes(value as VisualAssetId);
}

export function assetIcon(id: VisualAssetId, className = ''): string {
  const classes = ['asset-icon', className].filter(Boolean).join(' ');
  const spriteUrl = `${import.meta.env.BASE_URL}icons/utility-3d-icons.svg#${id}`;

  return `<svg class="${classes}" aria-hidden="true" focusable="false"><use href="${spriteUrl}"></use></svg>`;
}

export function toolAssetIcon(icon: string | undefined, fallback = '◇'): string {
  return isVisualAssetId(icon)
    ? assetIcon(icon, 'asset-icon--tool')
    : `<span class="asset-icon-fallback" aria-hidden="true">${fallback}</span>`;
}
