from PIL import Image,ImageSequence,ImageDraw
import numpy as np,json
from pathlib import Path
P=Path(__file__).resolve().parent
gif=Image.open(P/'walk-side-eye-fixed.gif');rows=[]
sheet=Image.new('RGB',(8*160,2*180),'white');draw=ImageDraw.Draw(sheet)
for i,frame in enumerate(ImageSequence.Iterator(gif)):
    src=Image.open(P/'side-fixed-frames'/f'{i+1:03}.png').convert('RGB');dec=frame.convert('RGB')
    a=np.asarray(src);b=np.asarray(dec)
    # A generous head-only region containing the sole visible eye.
    patch=a[135:200,130:170];mask=patch.mean(axis=2)<65
    decoded=b[135:200,130:170]
    rows.append({'frame':i+1,'eye_pixels':int(mask.sum()),'png_mean':patch[mask].mean(axis=0).tolist(),'gif_mean':decoded[mask].mean(axis=0).tolist()})
    if i in [0,3,6,9,12,15,18,21]:
        col=[0,3,6,9,12,15,18,21].index(i)
        for r,img in enumerate([src,dec]):
            crop=img.crop((125,135,175,200)).resize((120,156))
            sheet.paste(crop,(col*160,r*180));draw.text((col*160,r*180+158),f'{i+1} '+('PNG' if r==0 else 'GIF'),fill='black')
sheet.save(P/'eye-preview-comparison.png')
(P/'eye-preview-analysis.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
