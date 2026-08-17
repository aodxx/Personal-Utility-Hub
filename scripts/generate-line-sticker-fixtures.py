from pathlib import Path
from PIL import Image, ImageDraw

out = Path('tests/fixtures/line-sticker')
out.mkdir(parents=True, exist_ok=True)

sheet = Image.new('RGBA', (400, 300), (255, 255, 255, 255))
draw = ImageDraw.Draw(sheet)
colors = [(239, 68, 68, 255), (59, 130, 246, 255), (16, 185, 129, 255), (245, 158, 11, 255)]
for index, color in enumerate(colors):
    x = (index % 2) * 200
    y = (index // 2) * 150
    draw.ellipse((x + 35, y + 25, x + 165, y + 125), fill=color)
    draw.rectangle((x + 80, y + 55, x + 120, y + 95), fill=(255, 255, 255, 255))
sheet.save(out / 'geometric-sheet.png', optimize=True)

for index, color in enumerate(colors[:5] if len(colors) >= 5 else colors + [(168, 85, 247, 255)]):
    frame = Image.new('RGBA', (270, 270), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    offset = index * 8
    frame_draw.ellipse((40 + offset, 40, 230 + offset, 230), fill=color)
    frame_draw.ellipse((92 + offset, 92, 118 + offset, 122), fill=(255, 255, 255, 255))
    frame_draw.ellipse((152 + offset, 92, 178 + offset, 122), fill=(255, 255, 255, 255))
    frame.save(out / f'frame-{index + 1:02d}.png', optimize=True)
