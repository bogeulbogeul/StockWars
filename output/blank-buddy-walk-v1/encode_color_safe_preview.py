from PIL import Image, ImageSequence
from pathlib import Path
import numpy as np,json
P=Path(__file__).resolve().parent
frames=[Image.open(p).convert('RGB') for p in sorted((P/'side-fixed-frames').glob('*.png'))]
assert len(frames)==24
# Reserve dark grays explicitly: the small eye otherwise disappears during
# adaptive palette allocation, despite being black in every rendered frame.
atlas=Image.new('RGB',(480*6,480*4))
for i,img in enumerate(frames):atlas.paste(img,((i%6)*480,(i//6)*480))
adaptive=atlas.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
palette=[]
for value in range(64):palette.extend([value]*3)
palette.extend(adaptive.getpalette()[:192*3])
holder=Image.new('P',(1,1));holder.putpalette(palette)
quantized=[f.quantize(palette=holder,dither=Image.Dither.NONE) for f in frames]
durations=[40,40,40,40,40,50]*4
out=P/'walk-side-color-safe-v2.gif'
quantized[0].save(out,save_all=True,append_images=quantized[1:],duration=durations,loop=0,optimize=False,disposal=2)
frames[0].save(P/'walk-side-lossless-v2.webp',save_all=True,append_images=frames[1:],duration=durations,loop=0,lossless=True,quality=100)
report=[]
with Image.open(out) as gif:
    for i,frame in enumerate(ImageSequence.Iterator(gif)):
        src=np.asarray(frames[i])[135:200,130:170]
        dst=np.asarray(frame.convert('RGB'))[135:200,130:170]
        eye=src.mean(axis=2)<65
        error=np.abs(src[eye].astype(float)-dst[eye].astype(float))
        row={'frame':i+1,'source_eye_mean':src[eye].mean(axis=0).tolist(),
             'decoded_gif_eye_mean':dst[eye].mean(axis=0).tolist(),
             'max_channel_error':float(error.max())}
        assert error.max()<=5,row
        assert dst[eye].mean()<15,row
        report.append(row)
(P/'color-safe-preview-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'frames_verified':len(report),'worst_eye_channel_error':max(r['max_channel_error'] for r in report),'gif':str(out)}))
