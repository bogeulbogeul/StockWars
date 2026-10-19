"""Assemble existing frames as native edit targets, without redrawing pixels."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
for state, count in [('down_walk', 3), ('right_walk', 3), ('right_carry', 4), ('right_sit', 1)]:
    row = Image.new('RGBA', (320 * count, 400))
    for i in range(count):
        row.paste(Image.open(ROOT / f'rabbit/run/frames/{state}/frame-{i}.png'), (320*i, 0))
    (ROOT / 'edit-input').mkdir(exist_ok=True)
    row.save(ROOT / f'edit-input/{state}.png')
