"""Transfer native shading only onto unchanged v6 orange material pixels."""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
prior=root.parent/'red-fox-tail-root-v6/red-fox/run/frames'
palette=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
nearest=lambda rgb:palette[((palette-rgb)**2).sum(1).argmin()]
shades=np.array([nearest([232,119,39]),[253,138,44],nearest([255,155,65])],dtype=np.uint8)
parts=build.getparts('up_walk',3)
scale=340/parts[1].height
checks=[]
for i,part in enumerate(parts):
    guide=np.array(build.saveframe('up_walk',i,part,scale))
    old=np.array(Image.open(prior/f'up_walk/frame-{i}.png').convert('RGBA'))
    result=old.copy()
    material=np.all(old[:,:,:3]==[253,138,44],axis=2)&(old[:,:,3]>0)
    r,g,b=guide[:,:,:3].astype(int).transpose(2,0,1)
    guide_orange=(guide[:,:,3]>220)&(r>185)&(g>65)&(g<200)&(r-g>50)&(g-b>35)
    selected=material&guide_orange
    level=np.ones(material.shape,dtype=np.int32)
    level[g<125]=0
    level[g>153]=2
    result[selected,:3]=shades[level[selected]]
    Image.fromarray(result).save(build.RUN/f'frames/up_walk/frame-{i}.png')
    assert np.array_equal(result[:,:,3],old[:,:,3])
    assert np.array_equal(result[~material],old[~material])
    checks.append({'frame':i,'alpha_exact':True,'all_non_orange_pixels_exact':True,
                   'shadow_pixels':int((selected&(level==0)).sum()),
                   'light_pixels':int((selected&(level==2)).sum())})
shutil.copy2(build.RUN/'frames/up_walk/frame-1.png',build.RUN/'frames/up_idle/frame-0.png')
for path in (build.RUN/'frames').glob('*/*.png'):
    if path.parent.name not in ['up_idle','up_walk']:
        assert path.read_bytes()==(prior/path.relative_to(build.RUN/'frames')).read_bytes()
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-rear-shading-v7',shared_rgb_palette='../../palette.json',game_integrated=False)
build.write(build.RUN/'manifest.json',m)
p=root/'preview.html'
p.write_text(p.read_text(encoding='utf-8').replace("state.value='down_walk'","state.value='up_walk'"),encoding='utf-8')
build.write(root/'shading-verification.json',{'frames':checks,'shared_orange_shades_RGB':shades.tolist(),
    'palette_unchanged':True,'all_tail_geometry_and_white_tip_pixels_exact_v6':True,
    'other_frames_byte_identical':15,'game_installed':False,'live_motion_qa':'pending'})
