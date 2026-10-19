"""Schematic movement reference only. Never used as sprite pixels."""
from PIL import Image, ImageDraw
from pathlib import Path

root = Path(__file__).parent
im = Image.new('RGB', (1200, 650), 'white')
d = ImageDraw.Draw(im)
for x, phase in [(300, 'A'), (900, 'B')]:
    d.text((x-100, 20), f'{phase}: WALKING RIGHT', fill='black')
    d.ellipse((x-45, 60, x+65, 170), outline='black', width=5)
    d.line([(x, 175), (x, 340)], fill='black', width=10)
    if phase == 'A':
        far_arm = [(x, 190), (x+65, 240), (x+110, 235)]
        far_leg = [(x, 340), (x-65, 440), (x-120, 530)]
        near_arm = [(x, 190), (x-65, 260), (x-105, 300)]
        near_leg = [(x, 340), (x+65, 440), (x+120, 530)]
    else:
        far_arm = [(x, 190), (x-65, 260), (x-105, 300)]
        far_leg = [(x, 340), (x+65, 440), (x+120, 530)]
        near_arm = [(x, 190), (x+65, 240), (x+110, 235)]
        near_leg = [(x, 340), (x-65, 440), (x-120, 530)]
    for pts in [far_arm, far_leg]:
        d.line(pts, fill='#2682cb', width=15, joint='curve')
    for pts in [near_arm, near_leg]:
        d.line(pts, fill='#d43a38', width=22, joint='curve')
    d.text((x-130, 570), 'RED = NEAR arm + NEAR leg', fill='#b02d2a')
    d.text((x-130, 590), 'BLUE = FAR arm + FAR leg', fill='#1664a2')
    d.text((x-130, 610), 'Same-side arm/leg oppose each other', fill='black')
im.save(root / 'contralateral-pose-reference.png')
