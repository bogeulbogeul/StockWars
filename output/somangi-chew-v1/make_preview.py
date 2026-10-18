from pathlib import Path
from PIL import Image,ImageSequence
import numpy as np,json
P=Path(__file__).resolve().parent
frames=[Image.open(f).convert('RGB') for f in sorted((P/'front-frames').glob('*.png'))];assert len(frames)==36
atlas=Image.new('RGB',(2880,2880))
for i,f in enumerate(frames):atlas.paste(f,((i%6)*480,(i//6)*480))
adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT);palette=Image.new('P',(1,1));palette.putpalette([c for v in range(64) for c in [v,v,v]]+adaptive.getpalette()[:576])
quant=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames];durations=[80,80,90]*12
quant[0].save(P/'chew-front.gif',save_all=True,append_images=quant[1:],duration=durations,loop=0,optimize=False,disposal=2)
sheet=Image.new('RGB',(960,480))
for i,index in enumerate([0,2,4,6,8,10,12,14]):sheet.paste(frames[index].resize((240,240)),((i%4)*240,(i//4)*240))
sheet.save(P/'contact-sheet.png')
assert sum(f.info.get('duration',0) for f in ImageSequence.Iterator(Image.open(P/'chew-front.gif')))==3000
print('GIF_COMPLETE')
