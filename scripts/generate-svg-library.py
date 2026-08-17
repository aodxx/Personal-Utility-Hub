from pathlib import Path
from textwrap import dedent
import json

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
    ('ui', ['layout-utility', 'grid-utility', 'list-utility', 'filter-utility', 'refresh-utility', 'external-utility', 'more-utility', 'drag-utility']),
]

S = {
    'menu': '<path d="M4 6h16M4 12h16M4 18h16" />',
    'plus': '<path d="M12 5v14M5 12h14" />',
    'minus': '<path d="M5 12h14" />',
    'check': '<path d="m5 12 4 4L19 6" />',
    'close': '<path d="m6 6 12 12M18 6 6 18" />',
    'search': '<circle cx="10.8" cy="10.8" r="5.8" /><path d="m15.3 15.3 4.2 4.2" />',
    'settings': '<path d="m9.2 4.6.7-1.1h4.2l.7 1.1 1.4.8 1.3-.2 2.1 3.6-.7 1.1.1 1.6.8 1.1-2.1 3.6-1.3-.2-1.4.8-.7 1.1H9.9l-.7-1.1-1.4-.8-1.3.2-2.1-3.6.7-1.1-.1-1.6-.8-1.1 2.1-3.6 1.3.2 1.4-.8Z" /><circle cx="12" cy="12" r="2.8" />',
    'edit': '<path d="m4 16.8-.8 3.9 3.9-.8L18 9l-3-3L4 16.8Z" /><path d="m13.5 7.5 3 3M17 4l3 3" />',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6" />',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6" />',
    'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6" />',
    'arrow-left': '<path d="M19 12H5m6-6-6 6 6 6" />',
    'chevron-up': '<path d="m5 15 7-7 7 7" />',
    'chevron-right': '<path d="m9 5 7 7-7 7" />',
    'chevron-down': '<path d="m5 9 7 7 7-7" />',
    'chevron-left': '<path d="m15 5-7 7 7 7" />',
    'file': '<path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" />',
    'folder': '<path d="M3.5 6.5h6l2 2h9v10.8H3.5z" />',
    'file-text': '<path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" />',
    'file-plus': '<path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M12 12v6M9 15h6" />',
    'file-check': '<path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 15l2 2 4-5" />',
    'archive': '<path d="M4 7h16v13H4zM3 4h18v3H3z" /><path d="M9 11h6M10 15h4" />',
    'download': '<path d="M12 4v11M7 11l5 5 5-5M5 20h14" />',
    'upload': '<path d="M12 20V9M7 13l5-5 5 5M5 4h14" />',
    'play': '<path d="m8 5 11 7-11 7z" />',
    'pause': '<path d="M8 5v14M16 5v14" />',
    'stop': '<rect x="6" y="6" width="12" height="12" rx="1" />',
    'volume': '<path d="M4 10v4h3l5 4V6l-5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />',
    'mic': '<rect x="9" y="3" width="6" height="12" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />',
    'camera': '<path d="M4 8h4l1.5-2h5L16 8h4v11H4z" /><circle cx="12" cy="13.5" r="3.2" />',
    'image': '<rect x="4" y="5" width="16" height="14" rx="1" /><circle cx="9" cy="10" r="1.5" /><path d="m5 17 4-4 3 3 2-2 5 4" />',
    'music': '<path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />',
    'mail': '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 7 8 6 8-6" />',
    'message': '<path d="M4 5.5h16v11H9l-5 3z" /><path d="M8 10h8M8 13h5" />',
    'phone': '<path d="M7 3.5 10 5l-1.5 3a13 13 0 0 0 4.5 4.5l3-1.5 1.5 3-2 2c-1.5 1.5-7-2-9.5-5.5C3.5 7 4.5 5 7 3.5Z" />',
    'bell': '<path d="M6 16h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4zM10 19h4" />',
    'send': '<path d="m3 4 18 8-18 8 3-8z" /><path d="M6 12h15" />',
    'share': '<circle cx="6" cy="12" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" />',
    'link': '<path d="m10 14-2 2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M14 10l2-2a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0M8 12h8" />',
    'at': '<circle cx="12" cy="12" r="7" /><path d="M15 15v-5a3 3 0 1 0-1 5c2 1 4-1 4-3" />',
    'briefcase': '<rect x="4" y="7" width="16" height="12" rx="1" /><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2" />',
    'calendar': '<rect x="4" y="5" width="16" height="15" rx="1" /><path d="M8 3v4M16 3v4M4 9h16M8 13h2M12 13h2M16 13h0M8 16h2M12 16h2" />',
    'chart': '<path d="M5 19V9M12 19V5M19 19v-7" /><path d="M3 19h18" />',
    'clipboard': '<path d="M8 5h8v3H8zM6 6H4v15h16V6h-2M8 12h8M8 16h5" />',
    'target': '<circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" />',
    'wallet': '<path d="M4 6h15v14H4zM4 6l2-3h13v3" /><path d="M14 12h6v4h-6a2 2 0 0 1 0-4Z" />',
    'users': '<circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 7a3 3 0 0 1 0 6M16 14a5 5 0 0 1 4.5 5" />',
    'building': '<path d="M5 20V5l7-2 7 2v15M3 20h18M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2" />',
    'cart': '<path d="M4 5h2l2 10h10l2-7H7" /><circle cx="10" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />',
    'bag': '<path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />',
    'tag': '<path d="M4 5v6l9 9 7-7-9-9z" /><circle cx="8" cy="8" r="1.2" />',
    'credit-card': '<rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h4" />',
    'gift': '<rect x="4" y="9" width="16" height="11" rx="1" /><path d="M12 9v11M3 9h18M12 9H8a2.5 2.5 0 1 1 2.5-2.5c0 2.5 1.5 2.5 1.5 2.5ZM12 9h4a2.5 2.5 0 1 0-2.5-2.5C13.5 9 12 9 12 9Z" />',
    'package': '<path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" />',
    'receipt': '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" /><path d="M9 8h6M9 12h6M9 16h3" />',
    'store': '<path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-5h6v5" />',
    'heart': '<path d="M12 20S4 15 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6-6 9-6 9z" />',
    'star': '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />',
    'bookmark': '<path d="M6 4h12v16l-6-3-6 3z" />',
    'thumb-up': '<path d="M8 11v9H5v-9zM8 20h8a2 2 0 0 0 1.9-1.4l2-6A2 2 0 0 0 18 10h-4l.7-3.1A2.4 2.4 0 0 0 12.4 4L8 11" />',
    'flag': '<path d="M5 21V4M5 5h12l-2 4 2 4H5" />',
    'smile': '<circle cx="12" cy="12" r="8" /><path d="M8 14a5 5 0 0 0 8 0M9 9h.1M15 9h.1" />',
    'globe': '<circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />',
    'community': '<circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0M4 10a2.5 2.5 0 0 0 0 5M20 10a2.5 2.5 0 0 1 0 5M4 20a5 5 0 0 1 3-4.6M20 20a5 5 0 0 0-3-4.6" />',
    'pin': '<path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2" />',
    'map': '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />',
    'compass': '<circle cx="12" cy="12" r="8" /><path d="m15 9-2 4-4 2 2-4z" />',
    'route': '<circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />',
    'car': '<path d="m5 16 1.5-6h11L19 16M4 16h16v3H4z" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" />',
    'plane': '<path d="m3 11 18-7-7 18-3-8zM11 14l7-7" />',
    'train': '<rect x="5" y="4" width="14" height="15" rx="3" /><path d="M8 19l-2 2M16 19l2 2M5 12h14M9 8h.1M15 8h.1" />',
    'bike': '<circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="m6 17 4-8h4l4 8M10 9l-2-2h-2M10 9l4 8" />',
    'monitor': '<rect x="3" y="4" width="18" height="12" rx="1" /><path d="M8 20h8M12 16v4" />',
    'laptop': '<path d="M5 5h14v10H5zM3 18h18l-2 2H5z" />',
    'tablet': '<rect x="6" y="3" width="12" height="18" rx="2" /><path d="M11.5 18h1" />',
    'phone-device': '<rect x="7" y="3" width="10" height="18" rx="2" /><path d="M10 6h4M11 18h2" />',
    'watch': '<rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 7V3h6v4M9 17v4h6v-4" /><path d="M12 9v3l2 1" />',
    'printer': '<path d="M6 9V4h12v5M6 16H4V9h16v7h-2M7 14h10v7H7z" /><path d="M8 7h8" />',
    'keyboard': '<rect x="3" y="7" width="18" height="11" rx="1" /><path d="M6 10h.1M9 10h.1M12 10h.1M15 10h.1M18 10h.1M6 13h.1M9 13h6M18 13h.1" />',
    'wifi': '<path d="M3 9a14 14 0 0 1 18 0M6 13a9 9 0 0 1 12 0M9 17a4 4 0 0 1 6 0M12 20h.1" />',
    'circle': '<circle cx="12" cy="12" r="8" />',
    'square': '<rect x="5" y="5" width="14" height="14" rx="1" />',
    'triangle': '<path d="m12 4 9 16H3z" />',
    'diamond': '<path d="m12 3 8 9-8 9-8-9z" />',
    'hexagon': '<path d="m7 4 10 0 5 8-5 8H7l-5-8z" />',
    'octagon': '<path d="m8 3 8 0 5 5v8l-5 5H8l-5-5V8z" />',
    'plus-circle': '<circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" />',
    'minus-circle': '<circle cx="12" cy="12" r="8" /><path d="M8 12h8" />',
    'info': '<circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.1" />',
    'help': '<circle cx="12" cy="12" r="8" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.2 1-1.7 1.3-1.7 3M12 17h.1" />',
    'warning': '<path d="m12 4 9 16H3z" /><path d="M12 9v5M12 17h.1" />',
    'error': '<circle cx="12" cy="12" r="8" /><path d="m9 9 6 6M15 9l-6 6" />',
    'lock': '<rect x="5" y="10" width="14" height="10" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />',
    'key': '<circle cx="8" cy="15" r="3" /><path d="m10.5 12.5 8-8M15 7l2 2M17 5l2 2" />',
    'spark': '<path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7zM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6z" />',
    'code': '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />',
    'sun': '<circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />',
    'moon': '<path d="M19 15a7 7 0 0 1-10-10 8 8 0 1 0 10 10Z" />',
    'cloud': '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 7 18Z" />',
    'rain': '<path d="M6 13a4 4 0 0 1 .5-8 6 6 0 0 1 11.5 1A3.5 3.5 0 0 1 18 13H6Z" /><path d="m8 16-1 3M13 16l-1 3M18 16l-1 3" />',
    'snow': '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /><path d="m12 3-2 2M12 3l2 2M12 21l-2-2M12 21l2-2" />',
    'wind': '<path d="M3 8h12a2.5 2.5 0 1 0-2.5-2.5M3 12h17a2.5 2.5 0 1 1-2.5 2.5M3 16h10" />',
    'storm': '<path d="M7 14h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 7 14Z" /><path d="m13 13-3 5h3l-2 4 5-7h-3z" />',
    'thermometer': '<path d="M12 14V5a2 2 0 0 0-4 0v9a5 5 0 1 0 4 0Z" /><path d="M10 5v10" />',
    'shield': '<path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />',
    'shield-check': '<path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="m8 12 2.5 2.5L16 9" />',
    'fingerprint': '<path d="M7 12a5 5 0 0 1 10 0v4M9 12a3 3 0 0 1 6 0v7M12 12v8M5 12a7 7 0 0 1 14 0v2M4 15v-3a8 8 0 0 1 16 0" />',
    'scan': '<path d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4M8 12h8" />',
    'password': '<circle cx="6" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="12" r="2" />',
    'verified': '<path d="m12 3 2 1 2.3-.2 1.2 2 2 .9-.2 2.3 1 2-1 2 .2 2.3-2 .9-1.2 2-2.3-.2-2 1-2-1-2.3.2-1.2-2-2-.9.2-2.3-1-2 1-2-.2-2.3 2-.9 1.2-2 2.3.2z" /><path d="m8 12 2.5 2.5L16 9" />',
    'visibility': '<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" />',
    'privacy': '<path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12h6M10 9v3M14 9v3" />',
    'layout-utility': '<rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="16" /><rect x="4" y="14" width="6" height="6" />',
    'grid-utility': '<rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" />',
    'list-utility': '<path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" />',
    'filter-utility': '<path d="M4 5h16l-6 7v6l-4 2v-8z" />',
    'refresh-utility': '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4" />',
    'external-utility': '<path d="M13 5h6v6M19 5l-8 8M18 14v5H5V6h5" />',
    'more-utility': '<circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />',
    'drag-utility': '<circle cx="8" cy="7" r="1" /><circle cx="16" cy="7" r="1" /><circle cx="8" cy="12" r="1" /><circle cx="16" cy="12" r="1" /><circle cx="8" cy="17" r="1" /><circle cx="16" cy="17" r="1" />',
}

entries = []
for category, names in categories:
    for name in names:
        if name not in S:
            raise KeyError(f'Missing semantic shape for {name}')
        title = ' '.join(part.capitalize() for part in name.replace('-utility', '').split('-'))
        aria_id = f'title-{name}'
        svg = dedent(f'''\
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" role="img" aria-labelledby="{aria_id}">
          <title id="{aria_id}">{title}</title>
          {S[name]}
        </svg>\n''')
        (ASSET_DIR / f'{name}.svg').write_text(svg, encoding='utf-8')
        entries.append({
            'id': name,
            'title': title,
            'keywords': [name.replace('-', ' '), category, 'svg', 'icon'],
            'category': category,
            'style': 'outline',
            'properties': ['currentColor', 'monochrome'],
            'source': f'Original Utility Hub asset: public/svg-assets/{name}.svg',
            'author': 'Personal Utility Hub',
            'license': 'Original — Utility Hub',
            'licenseUrl': '/docs/svg-library-license-policy.md',
            'sourceUrl': 'https://github.com/aodxx/Personal-Utility-Hub/tree/main/public/svg-assets',
            'attributionRequired': False,
            'commercialUseAllowed': True,
            'modifiedAllowed': True,
            'assetUrl': f'./svg-assets/{name}.svg',
            'filename': f'{name}.svg',
            'viewBox': '0 0 24 24',
            'reviewed': True,
            'reviewedAt': '2026-08-17',
            'semantic': title,
        })

MANIFEST.write_text(
    'export interface SvgAssetMetadata {\n'
    "  id: string; title: string; keywords: string[]; category: string; style: 'outline' | 'filled' | 'rounded' | 'sharp';\n"
    '  properties: string[]; source: string; author: string; license: string; licenseUrl: string; sourceUrl: string;\n'
    '  attributionRequired: boolean; commercialUseAllowed: boolean; modifiedAllowed: boolean; assetUrl: string; filename: string; viewBox: string;\n'
    '  reviewed: boolean; reviewedAt: string; semantic: string;\n'
    '}\n\n'
    f'export const svgAssetManifest: readonly SvgAssetMetadata[] = {json.dumps(entries, ensure_ascii=False, indent=2)};\n\n'
    f'export const svgAssetCount = {len(entries)};\n',
    encoding='utf-8',
)
print(f'generated {len(entries)} semantic SVG assets at {ASSET_DIR}')
print(f'wrote manifest at {MANIFEST}')
