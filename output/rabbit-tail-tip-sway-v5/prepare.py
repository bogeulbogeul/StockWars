"""Extract native tail drawings and register only their upper fluff."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.frames.extract import extract_component_images,resize_cell

root=Path(__file__).parent
old=root.parent/'rabbit-portrait-design-v4/rabbit/run'
parts=extract_component_images(Image.open(root/'native/tail-row.png').convert('RGBA'),3)
assert parts is not None and len(parts)==3
canvas=Image.new('RGBA',(1280,4000))
records=[]
original=Image.open(old/'frames/up_walk/frame-0.png').convert('RGBA')
tail_colors=np.unique(np.array(original.crop((138,224,182,270))).reshape(-1,4)[:,:3],axis=0).astype(np.int32)
for index,part_index in [(0,0),(2,2)]:
    part=parts[part_index].crop(parts[part_index].getbbox())
    part=resize_cell(part,(round(part.width*46/part.height),46))
    alpha=np.asarray(part)[:,:,3]>100
    mids=[]
    for row in alpha[-12:]:
        xs=np.flatnonzero(row)
        if len(xs):mids.append((xs[0]+xs[-1])/2)
    left=round(28-float(np.median(mids)))
    # Place native drawing at y4, keeping the lower connection at y50.
    patch=Image.new('RGBA',(56,50),(202,162,137,255))
    patch.alpha_composite(part,(left,4))
    oldpatch=original.crop((132,220,188,270))
    a=np.array(patch).astype(float);b=np.array(oldpatch).astype(float)
    for y in range(31,36):
        weight=(36-y)/6
        a[y,:,:3]=np.rint(a[y,:,:3]*weight+b[y,:,:3]*(1-weight))
    a[36:]=b[36:]
    # Only the upper 36 rows are exported; lower root remains the exact PNG.
    a[36:,:,3]=0
    patch=Image.fromarray(a.astype(np.uint8))
    canvas.paste(patch,(index*320+132,2000+220))
    records.append({'frame':index,'box':[132,220,188,256],'root_preserved_from_y':256,
                    'native_part':part_index,'native_width':part.width,'root_x':160})
canvas.save(root/'upper-tail-patches.png')
a=np.array(canvas);colors=np.unique(a[a[:,:,3]>0,:3],axis=0).astype(np.int32)
targets=tail_colors[((colors[:,None,:]-tail_colors[None,:,:])**2).sum(axis=2).argmin(axis=1)]
hx=lambda c:'#'+''.join(f'{int(v):02x}' for v in c)
spec={'version':1,'kind':'sprite-gen-recolor','match':'exact','tolerance':0,
      'variants':[{'name':'upper-tail','map':{hx(c):hx(t) for c,t in zip(colors,targets)}}]}
(root/'recolor-spec.json').write_text(json.dumps(spec,separators=(',',':')),encoding='utf-8')
(root/'registration.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records))
