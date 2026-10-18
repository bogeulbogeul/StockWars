"""Canonical native extraction and material-aware portrait color preparation."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.frames.extract import extract_component_images,resize_cell

root=Path(__file__).parent
old=root.parent/'rabbit-face-rear-cleanup-v3'
image=Image.open(root/'native/portrait.png').convert('RGBA')
parts=extract_component_images(image,1)
assert parts is not None and len(parts)==1
part=parts[0].crop(parts[0].getbbox())
scale=min(304/part.width,360/part.height)
sprite=resize_cell(part,(round(part.width*scale),round(part.height*scale)))
frame=Image.new('RGBA',(320,400))
x=(320-sprite.width)//2;y=380-sprite.height
frame.paste(sprite,(x,y))
frame.save(root/'portrait-native-aligned.png')
a=np.array(frame);h,w=sprite.height,sprite.width
yy,xx=np.indices((400,320))
# Preserve the new iris/pupil RGB directly, rather than flattening it into
# the old palette's few brown swatches. Fur/ears retain the prior palette.
eye_zone=(yy>y+h*.63)&(yy<y+h*.84)&(((xx>x+w*.12)&(xx<x+w*.43))|((xx>x+w*.57)&(xx<x+w*.88)))
rgb=a[:,:,:3].astype(np.int32)
eye=eye_zone&(a[:,:,3]>0)&(rgb[:,:,0]<235)&(rgb[:,:,1]<155)&(rgb[:,:,2]<115)
Image.fromarray(np.where(eye,255,0).astype(np.uint8)).save(root/'iris-preserve-mask.png')
palette=np.array(json.loads((old/'palette.json').read_text(encoding='utf-8'))['rgb'],dtype=np.int32)
colors=np.unique(rgb[a[:,:,3]>0],axis=0)
targets=[]
for start in range(0,len(colors),1024):
    chunk=colors[start:start+1024]
    targets.extend(palette[((chunk[:,None,:]-palette[None,:,:])**2).sum(axis=2).argmin(axis=1)].tolist())
hx=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
spec={'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,
      'variants':[{'name':'portrait-fur','map':{hx(c):hx(t) for c,t in zip(colors,targets)}}]}
(root/'portrait-fur-spec.json').write_text(json.dumps(spec,separators=(',',':')),encoding='utf-8')
print(json.dumps({'native_components':1,'portrait_size':sprite.size,'placement':[x,y],
                  'iris_pixels_preserved':int(eye.sum()),'native_RGB_count':len(colors)}))
