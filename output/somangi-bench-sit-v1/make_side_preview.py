from pathlib import Path
from PIL import Image,ImageSequence
import numpy as np
P=Path(__file__).resolve().parent
frames=[Image.open(f).convert('RGB') for f in sorted((P/'side-frames').glob('*.png'))]
assert len(frames)==36
atlas=Image.new('RGB',(480*6,600*6))
for i,img in enumerate(frames):atlas.paste(img,((i%6)*480,(i//6)*600))
adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
holder=Image.new('P',(1,1));holder.putpalette([c for v in range(64) for c in [v,v,v]]+adaptive.getpalette()[:576])
quant=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
out=P/'bench-sit-side.gif'
quant[0].save(out,save_all=True,append_images=quant[1:],duration=[80,80,90]*12,loop=0,optimize=False,disposal=2)
elapsed=0;starts=np.cumsum([0]+[80,80,90]*12)
for img in ImageSequence.Iterator(Image.open(out)):
    i=int(np.searchsorted(starts,elapsed,side='right')-1)
    src=np.asarray(frames[i]);dst=np.asarray(img.convert('RGB'))
    mask=(src[:400].mean(axis=2)<15)
    if mask.any():assert dst[:400][mask].mean()<25
    elapsed+=img.info.get('duration',0)
print('Side preview saved; dark pixels checked')
