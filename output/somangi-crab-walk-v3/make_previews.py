from pathlib import Path
from PIL import Image
P=Path(__file__).resolve().parent
sheet=Image.new('RGB',(960,480),'white')
for row,view in enumerate(['face','angle']):
    frames=[Image.open(p).convert('RGB') for p in sorted((P/(view+'-frames')).glob('*.png'))];assert len(frames)==24
    atlas=Image.new('RGB',(2880,1920))
    for i,f in enumerate(frames):atlas.paste(f,((i%6)*480,(i//6)*480))
    palette=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
    holder=Image.new('P',(1,1));holder.putpalette([c for v in range(64) for c in [v,v,v]]+palette.getpalette()[:576])
    quant=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
    quant[0].save(P/f'crab-{view}.gif',save_all=True,append_images=quant[1:],duration=[40,40,40,40,40,50]*4,loop=0,optimize=False,disposal=2)
    for j,index in enumerate([0,6,12,18]):sheet.paste(frames[index].resize((240,240)),(j*240,row*240))
sheet.save(P/'contact-sheet.png');print('PREVIEWS_COMPLETE')
