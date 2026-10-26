from pathlib import Path
from PIL import Image, ImageDraw

P = Path(__file__).resolve().parent
frames = {}
timing = [30]*21+[40]*3
for view in ['front', 'side']:
    paths = sorted((P/(view+'-frames')).glob('*.png'))
    assert len(paths) == 24, (view, len(paths))
    frames[view] = [Image.open(path).convert('RGB') for path in paths]
    frames[view][0].save(P/(view+'.gif'), save_all=True,
        append_images=frames[view][1:], duration=timing, loop=0, disposal=2)
combined = []
for a, b in zip(frames['front'], frames['side']):
    canvas = Image.new('RGB', (880, 520))
    canvas.paste(a, (0,0))
    canvas.paste(b, (440,0))
    combined.append(canvas)
combined[0].save(P/'walk-preview.gif', save_all=True,
    append_images=combined[1:], duration=timing, loop=0, disposal=2)
sheet = Image.new('RGB', (1320, 780))
for row, view in enumerate(['front', 'side']):
    for col, index in enumerate([0,6,12,18]):
        image = frames[view][index].resize((330,390), Image.Resampling.LANCZOS)
        sheet.paste(image,(col*330,row*390))
sheet.save(P/'contact-sheet.png')
print('PREVIEWS_COMPLETE')
