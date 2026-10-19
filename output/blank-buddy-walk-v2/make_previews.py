from pathlib import Path
from PIL import Image,ImageSequence,ImageDraw
import numpy as np,json
P=Path(__file__).resolve().parent
checks={};sheet=Image.new('RGB',(960,480),'white')
for name in ['front','side']:
    frames=[Image.open(f).convert('RGB') for f in sorted((P/(name+'-frames')).glob('*.png'))]
    assert len(frames)==24
    atlas=Image.new('RGB',(2880,1920))
    for i,img in enumerate(frames):atlas.paste(img,((i%6)*480,(i//6)*480))
    adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
    palette=[c for v in range(64) for c in [v,v,v]]+adaptive.getpalette()[:576]
    holder=Image.new('P',(1,1));holder.putpalette(palette)
    quant=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
    out=P/f'walk-{name}.gif'
    quant[0].save(out,save_all=True,append_images=quant[1:],duration=[40,40,40,40,40,50]*4,loop=0,optimize=False,disposal=2)
    worst=0
    for i,f in enumerate(ImageSequence.Iterator(Image.open(out))):
        src=np.asarray(frames[i]);dst=np.asarray(f.convert('RGB'))
        region=(slice(135,200),slice(130,170)) if name=='side' else (slice(140,190),slice(175,305))
        source_eye=src[region];decoded_eye=dst[region]
        mask=(source_eye.mean(axis=2)<30)
        if mask.any():
            worst=max(worst,float(np.abs(source_eye[mask].astype(float)-decoded_eye[mask].astype(float)).max()))
            assert decoded_eye[mask].mean()<35
    assert worst<=12,(name,worst)
    checks[name]={'frames':24,'max_dark_pixel_channel_error':worst}
    for j,idx in enumerate([0,6,12,18]):
        sheet.paste(frames[idx].resize((240,240)),(j*240,0 if name=='front' else 240))
sheet.save(P/'contact-sheet.png')
(P/'preview-validation.json').write_text(json.dumps(checks,indent=2));print(json.dumps(checks))
