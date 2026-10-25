from PIL import Image
from pathlib import Path
import sys
P=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parent
views=sys.argv[2].split(',') if len(sys.argv)>2 else ['front','side']
for view in views:
 frames=[Image.open(f).convert('RGB') for f in sorted((P/view).glob('*.png'))]
 palette=frames[0].quantize(colors=256)
 frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 frames[0].save(P/f'walk-{view}.gif',save_all=True,append_images=frames[1:],duration=[20,30]*15,loop=0,disposal=2,optimize=False)
sheet=Image.new('RGB',(420*4,500*2))
for row,view in enumerate(views):
 for col,frame in enumerate([0,7,15,22]):sheet.paste(Image.open(P/view/f'{frame:02}.png'),(col*420,row*500))
sheet.save(P/'inspection.png')
print('Saved front/side GIFs: 750 ms each, looped, actual game GLB')
hips=Image.new('RGB',(220*10,155*3*len(views)))
for viewIndex,view in enumerate(views):
 for frame in range(30):
  crop=Image.open(P/view/f'{frame:02}.png').crop((100,300,320,455))
  hips.paste(crop,((frame%10)*220,(viewIndex*3+frame//10)*155))
hips.save(P/'hip-inspection-all-frames.png')
