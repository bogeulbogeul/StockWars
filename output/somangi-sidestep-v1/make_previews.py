from pathlib import Path
from PIL import Image,ImageSequence,ImageDraw
import numpy as np,json
P=Path(__file__).resolve().parent
checks={};sheet=Image.new('RGB',(960,480),'white')
for name in ['front','side']:
    frames=[Image.open(f).convert('RGB') for f in sorted((P/(name+'-frames')).glob('*.png'))]
    assert len(frames)==24
    atlas=Image.new('RGB',(2880,2880))
    for i,img in enumerate(frames):atlas.paste(img,((i%6)*480,(i//6)*480))
    adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
    holder=Image.new('P',(1,1));holder.putpalette([c for v in range(64) for c in [v,v,v]]+adaptive.getpalette()[:576])
    quant=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
    out=P/f'sidestep-{name}.gif';durations=[40,40,40,40,40,50]*4
    quant[0].save(out,save_all=True,append_images=quant[1:],duration=durations,loop=0,optimize=False,disposal=2)
    starts=np.cumsum([0]+durations);elapsed=0;count=0
    for img in ImageSequence.Iterator(Image.open(out)):
        i=int(np.searchsorted(starts,elapsed,side='right')-1);src=np.asarray(frames[i]);dst=np.asarray(img.convert('RGB'))
        mask=(src[:260].mean(axis=2)<15)
        if mask.any():assert dst[:260][mask].mean()<25
        count+=1;elapsed+=img.info.get('duration',0)
    checks[name]={'source_frames':24,'decoded_frames':count,'black_eye_preserved':True}
    for j,idx in enumerate([0,6,12,18]):sheet.paste(frames[idx].resize((240,240)),(240*j,0 if name=='front' else 240))
sheet.save(P/'contact-sheet.png');(P/'preview-validation.json').write_text(json.dumps(checks,indent=2));print(json.dumps(checks))

