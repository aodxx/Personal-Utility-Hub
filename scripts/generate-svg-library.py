from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / 'public' / 'svg-assets'
MANIFEST = ROOT / 'src' / 'data' / 'svg-assets' / 'manifest.ts'
ASSET_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST.parent.mkdir(parents=True, exist_ok=True)

categories = [
    ('ui', ['menu', 'plus', 'minus', 'check', 'close', 'search', 'settings', 'edit']),
    ('arrows', ['arrow-up', 'arrow-right', 'arrow-down', 'arrow-left', 'chevron-up', 'chevron-right', 'chevron-down', 'chevron-left']),
    ('files', ['file', 'folder', 'file-text', 'file-plus', 'file-check', 'archive', 'download', 'upload']),
    ('media', ['play', 'pause', 'stop', 'volume', 'mic', 'camera', 'image', 'music']),
    ('communication', ['mail', 'message', 'phone', 'bell', 'send', 'share', 'link', 'at']),
    ('business', ['briefcase', 'calendar', 'chart', 'clipboard', 'target', 'wallet', 'users', 'building']),
    ('shopping', ['cart', 'bag', 'tag', 'credit-card', 'gift', 'package', 'receipt', 'store']),
    ('social', ['heart', 'star', 'bookmark', 'thumb-up', 'flag', 'smile', 'globe', 'community']),
    ('maps', ['pin', 'map', 'compass', 'route', 'car', 'plane', 'train', 'bike']),
    ('devices', ['monitor', 'laptop', 'tablet', 'phone-device', 'watch', 'printer', 'keyboard', 'wifi']),
    ('shapes', ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'octagon', 'plus-circle', 'minus-circle']),
    ('symbols', ['info', 'help', 'warning', 'error', 'lock', 'key', 'spark', 'code']),
    ('weather', ['sun', 'moon', 'cloud', 'rain', 'snow', 'wind', 'storm', 'thermometer']),
    ('security', ['shield', 'shield-check', 'fingerprint', 'scan', 'password', 'verified', 'visibility', 'privacy']),
    ('ui', ['layout', 'grid', 'list', 'filter', 'refresh', 'external', 'more', 'drag']),
]

primitive_shapes = [
    '<path d="M4 12h16M12 4v16" />',
    '<path d="m6 9 6 6 6-6" />',
    '<path d="M5 12h14M12 5l7 7-7 7" />',
    '<circle cx="12" cy="12" r="7" /><path d="m8.5 12 2.3 2.3 4.8-5" />',
    '<rect x="5" y="5" width="14" height="14" rx="3" /><path d="M8 12h8" />',
    '<path d="M5 19 19 5M8 5h11v11" />',
    '<circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" />',
    '<path d="M4 7h16M4 12h16M4 17h16" />',
]

entries = []
for category, names in categories:
    for index, name in enumerate(names):
        # The last category intentionally contributes a second UI set; IDs remain unique.
        suffix = '' if category != 'ui' or name not in {'layout', 'grid', 'list', 'filter', 'refresh', 'external', 'more', 'drag'} else '-utility'
        asset_id = f'{name}{suffix}'
        title = ' '.join(part.capitalize() for part in name.replace('-utility', '').split('-'))
        shape = primitive_shapes[index % len(primitive_shapes)]
        stroke_width = 1.5 if index % 3 else 2
        fill = 'none' if index % 4 != 0 else 'currentColor'
        svg = dedent(f'''\
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="{fill}" stroke="currentColor" stroke-width="{stroke_width}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-labelledby="title-{asset_id}">
          <title id="title-{asset_id}">{title}</title>
          {shape}
        </svg>\n''')
        (ASSET_DIR / f'{asset_id}.svg').write_text(svg, encoding='utf-8')
        style = ['outline', 'rounded', 'sharp', 'filled'][index % 4]
        entries.append({
            'id': asset_id,
            'title': title,
            'keywords': [name.replace('-', ' '), category, 'svg', 'icon'],
            'category': category,
            'style': style,
            'properties': ['currentColor', 'monochrome'],
            'source': f'Original Utility Hub asset: public/svg-assets/{asset_id}.svg',
            'author': 'Personal Utility Hub',
            'license': 'Original — Utility Hub',
            'licenseUrl': '/docs/svg-library-license-policy.md',
            'sourceUrl': 'https://github.com/aodxx/Personal-Utility-Hub/tree/main/public/svg-assets',
            'attributionRequired': False,
            'commercialUseAllowed': True,
            'modifiedAllowed': True,
            'assetUrl': f'/svg-assets/{asset_id}.svg',
            'filename': f'{asset_id}.svg',
            'viewBox': '0 0 24 24',
        })

lines = [
    "export interface SvgAssetMetadata {",
    "  id: string; title: string; keywords: string[]; category: string; style: 'outline' | 'filled' | 'rounded' | 'sharp';",
    "  properties: string[]; source: string; author: string; license: string; licenseUrl: string; sourceUrl: string;",
    "  attributionRequired: boolean; commercialUseAllowed: boolean; modifiedAllowed: boolean; assetUrl: string; filename: string; viewBox: string;",
    "}",
    "",
    "export const svgAssetManifest: readonly SvgAssetMetadata[] = [",
]
for entry in entries:
    lines.append(f"  {entry!r},")
lines += ["];", "", f"export const svgAssetCount = {len(entries)};"]
# Convert Python repr to valid TS single-quoted object keys/strings via simple JSON-ish replacement.
text = '\n'.join(lines).replace("'", '"')
MANIFEST.write_text(text + '\n', encoding='utf-8')
print(f'generated {len(entries)} SVG assets at {ASSET_DIR}')
print(f'wrote manifest at {MANIFEST}')
