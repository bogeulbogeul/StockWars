from pathlib import Path
from PIL import Image,ImageSequence,ImageDraw
import numpy as np,json
P=Path(__file__).resolve().parent
frames=[Image.open(f).convert('RGB') for f in sorted((P/'frames').glob('*.png'))]
assert len(frames)==36
atlas=Image.new('RGB',(640*6,600*6))
for i,img in enumerate(frames):atlas.paste(img,((i%6)*640,(i//6)*600))
adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
palette=[c for v in range(64) for c in [v,v,v]]+adaptive.getpalette()[:576]
holder=Image.new('P',(1,1));holder.putpalette(palette)
quant=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
quant[0].save(P/'bench-sit-preview.gif',save_all=True,append_images=quant[1:],duration=[80,80,90]*12,loop=0,optimize=False,disposal=2)
sheet=Image.new('RGB',(960,640),'white');draw=ImageDraw.Draw(sheet)
for j,i in enumerate([0,4,8,12,18,24,28,32]):
    x=(j%4)*240;y=(j//4)*320;sheet.paste(frames[i].resize((240,225)),(x,y))
    draw.text((x+8,y+230),f'Frame {i*2+1}',fill='black')
sheet.save(P/'contact-sheet.png')
print('Preview and contact sheet saved')
