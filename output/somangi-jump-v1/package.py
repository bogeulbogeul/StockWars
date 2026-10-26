from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
for view in ['front','side']:
 frames=[Image.open(f).convert('RGB') for f in sorted((P/view).glob('*.png'))]
 palette=frames[0].quantize(colors=256)
 frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 frames[0].save(P/f'jump-{view}.gif',save_all=True,append_images=frames[1:],duration=[20,30]*18,loop=0,disposal=2,optimize=False)
sheet=Image.new('RGB',(420*4,500*2))
for row,view in enumerate(['front','side']):
 for col,frame in enumerate([0,5,11,22]):sheet.paste(Image.open(P/view/f'{frame:02}.png'),(col*420,row*500))
sheet.save(P/'inspection.png')
print('Saved jump previews: 0.55s hop + landed pause, actual runtime player')
