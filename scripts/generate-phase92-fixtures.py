from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path('tests/fixtures/line-sticker')
OUT.mkdir(parents=True, exist_ok=True)

# Realistic synthetic sheet: 4x4, white background, large subject, text-like bars, thin separators.
size = 1536
cell = size // 4
colors = [(235, 78, 82), (55, 126, 232), (24, 177, 132), (245, 161, 42), (143, 92, 221), (32, 164, 214), (239, 105, 167), (98, 184, 76), (239, 124, 45), (54, 150, 207), (177, 96, 200), (83, 178, 128), (220, 82, 73), (78, 119, 210), (242, 133, 64), (92, 170, 160)]
real = Image.new('RGB', (size, size), 'white')
draw = ImageDraw.Draw(real)
for index, color in enumerate(colors):
    row, col = divmod(index, 4)
    x0, y0 = col * cell, row * cell
    cx, cy = x0 + cell // 2, y0 + cell // 2 - 35
    draw.ellipse((cx - 145, cy - 145, cx + 145, cy + 145), fill=color)
    draw.ellipse((cx - 82, cy - 65, cx - 22, cy - 5), fill='white')
    draw.ellipse((cx + 22, cy - 65, cx + 82, cy - 5), fill='white')
    draw.arc((cx - 72, cy - 15, cx + 72, cy + 90), 15, 165, fill='white', width=14)
    draw.rounded_rectangle((x0 + 105, y0 + 475, x0 + 280, y0 + 505), radius=12, fill=(38, 38, 38))
    draw.rounded_rectangle((x0 + 305, y0 + 475, x0 + 410, y0 + 505), radius=12, fill=(110, 110, 110))
    draw.rectangle((x0, y0, x0 + cell - 1, y0 + cell - 1), outline=(220, 220, 220), width=3)
real.save(OUT / 'realistic-4x4-sheet.png')

# Pixel-signature sheet: each cell has a unique center color and corner markers.
sig_size = 1024
sig_cell = sig_size // 4
palette = [(230, 40, 40), (40, 100, 230), (20, 170, 100), (240, 150, 20), (150, 60, 210), (20, 160, 210), (220, 70, 140), (80, 170, 60), (230, 100, 30), (50, 130, 190), (170, 80, 190), (50, 170, 120), (210, 60, 60), (70, 100, 200), (230, 120, 40), (70, 160, 160)]
sig = Image.new('RGB', (sig_size, sig_size), 'white')
draw = ImageDraw.Draw(sig)
for index, color in enumerate(palette):
    row, col = divmod(index, 4)
    x0, y0 = col * sig_cell, row * sig_cell
    draw.rectangle((x0, y0, x0 + sig_cell - 1, y0 + sig_cell - 1), fill=color, outline=(255, 255, 255), width=2)
    marker = (20 + index * 11, 20 + index * 7, 20 + index * 5)
    draw.rectangle((x0 + 8, y0 + 8, x0 + 35, y0 + 35), fill=marker)
    draw.rectangle((x0 + sig_cell - 36, y0 + sig_cell - 36, x0 + sig_cell - 9, y0 + sig_cell - 9), fill=tuple(255 - value for value in marker))
sig.save(OUT / 'pixel-signature-4x4-sheet.png')
