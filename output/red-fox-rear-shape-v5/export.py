"""Extract coherent rear drawings with the existing fox RGB palette."""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
prior=root.parent/'red-fox-carry-lines-v4/red-fox/run/frames'
pal=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
parts=build.getparts('up_walk',3)
scale=340/parts[1].height
for i,part in enumerate(parts):
    frame=build.saveframe('up_walk',i,part,scale)
    a=np.array(frame);visible=a[:,:,3]>0
    colors,inverse=np.unique(a[visible,:3],axis=0,return_inverse=True)
    targets=[]
    for start in range(0,len(colors),512):
        chunk=colors[start:start+512].astype(np.int32)
        targets.append(pal[((chunk[:,None]-pal[None])**2).sum(2).argmin(1)])
    a[visible,:3]=np.concatenate(targets)[inverse]
    Image.fromarray(a).save(build.RUN/f'frames/up_walk/frame-{i}.png')
shutil.copy2(build.RUN/'frames/up_walk/frame-1.png',build.RUN/'frames/up_idle/frame-0.png')
unchanged=[]
for path in (build.RUN/'frames').glob('*/*.png'):
    if path.parent.name not in ['up_idle','up_walk']:
        relative=path.relative_to(build.RUN/'frames')
        assert path.read_bytes()==(prior/relative).read_bytes()
        unchanged.append(str(relative))
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-rear-shape-v5',shared_rgb_palette='../../palette.json')
build.write(build.RUN/'manifest.json',m)
p=root/'preview.html'
p.write_text(p.read_text(encoding='utf-8').replace("state.value='down_walk'","state.value='up_walk'"),encoding='utf-8')
build.write(root/'preservation.json',{'other_frames_byte_identical':len(unchanged),'palette_unchanged':True,'rear_idle_equals_neutral':True,'live_visual_qa':'pending'})
