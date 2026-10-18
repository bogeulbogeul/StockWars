"""Extract coherent native carry drawings and bake the existing shared palette."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
pal=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
parts=build.getparts('right_carry',4)
scale=340/np.median([p.height for p in parts])
metrics=[]
for i,part in enumerate(parts):
    frame=build.saveframe('right_carry',i,part,scale)
    a=np.array(frame)
    visible=a[:,:,3]>0
    colors,inverse=np.unique(a[visible,:3],axis=0,return_inverse=True)
    targets=[]
    for start in range(0,len(colors),512):
        chunk=colors[start:start+512].astype(np.int32)
        targets.append(pal[((chunk[:,None]-pal[None])**2).sum(2).argmin(1)])
    a[visible,:3]=np.concatenate(targets)[inverse]
    r,g,b=a[:,:,:3].astype(int).transpose(2,0,1)
    orange=visible&(r>200)&(r-g>65)&(r-b>120)
    # Exclude irises; preserve native outlines and all non-orange anatomy.
    orange[120:180,100:225]=False
    a[orange,:3]=[253,138,44]
    Image.fromarray(a).save(build.RUN/f'frames/right_carry/frame-{i}.png')
    metrics.append({'frame':i,'ear_top_y':int(np.where(visible)[0].min())})
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-carry-lines-v4',shared_rgb_palette='../../palette.json')
build.write(build.RUN/'manifest.json',m)
p=root/'preview.html'
p.write_text(p.read_text(encoding='utf-8').replace("state.value='down_walk'","state.value='right_carry'"),encoding='utf-8')
build.write(root/'carry-metrics.json',{'frames':metrics,'head_top_range_px':max(t['ear_top_y'] for t in metrics)-min(t['ear_top_y'] for t in metrics),'no_horizontal_head_splice':True,'live_visual_qa':'pending'})
