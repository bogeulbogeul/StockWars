"""Bake reference-guided material shading; preserve adopted geometry and face details."""
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import build

root=Path(__file__).parent
prior=root.parent/'red-fox-tail-root-v6/red-fox/run/frames'
rows=json.loads((root/'row-map.json').read_text())
palette=np.array(json.loads((root/'palette.json').read_text())['rgb'],dtype=np.int32)
nearest=lambda rgb:palette[((palette-rgb)**2).sum(1).argmin()]
orange_shades=np.array([nearest([232,119,39]),[253,138,44],nearest([255,153,62])],dtype=np.uint8)
brown_shades=np.array([nearest([60,35,24]),[78,46,30],nearest([96,59,37])],dtype=np.uint8)
checks=[]

def interior(mask):
    return np.array(Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)))>0

for name,states in rows.items():
    parts=build.getparts(name,len(states))
    guides=[]
    for (state,i),part in zip(states,parts):
        old=Image.open(prior/f'{state}/frame-{i}.png').convert('RGBA')
        scale=(old.getbbox()[3]-old.getbbox()[1])/part.height
        frame=build.saveframe(state,i,part,scale,ground=380 if state=='face_portrait' else 372)
        # Smooth only the generated color guide; original sprite pixels/edges
        # are never blurred or resampled.
        rgb=np.array(frame.convert('RGB').filter(ImageFilter.GaussianBlur(1.1)))
        guide=np.array(frame);guide[:,:,:3]=rgb
        guides.append(guide)
    # Normalize each row's generated base before applying one shared shade set.
    orange_values=[];brown_values=[]
    for guide in guides:
        r,g,b=guide[:,:,:3].astype(int).transpose(2,0,1)
        orange=(guide[:,:,3]>220)&(r>185)&(g>80)&(g<190)&(r-g>45)&(g-b>35)
        brown=(guide[:,:,3]>220)&(r>40)&(r<135)&(g<100)&(b<90)&(r-g>12)
        orange_values.extend(g[orange].tolist());brown_values.extend(r[brown].tolist())
    mode=lambda values: int(np.argmax(np.bincount(np.array(values,dtype=int)//8,minlength=32))*8+4)
    orange_base=mode(orange_values) if orange_values else 140
    brown_base=mode(brown_values) if brown_values else 76
    for (state,i),guide in zip(states,guides):
        old=np.array(Image.open(prior/f'{state}/frame-{i}.png').convert('RGBA'))
        out=old.copy();visible=old[:,:,3]>0
        orange=interior(np.all(old[:,:,:3]==[253,138,44],axis=2)&visible)
        brown=interior(np.all(old[:,:,:3]==[78,46,30],axis=2)&visible)
        # Eyes, nose, mouth and their highlights keep their original RGBA.
        if not state.startswith('up_'):
            if state=='face_portrait':
                orange[210:,:]=False;brown[210:,:]=False
            else:
                orange[120:185,100:230]=False;brown[120:195,:]=False
        r,g,b=guide[:,:,:3].astype(int).transpose(2,0,1)
        eligible_orange=(guide[:,:,3]>220)&(r>185)&(g>65)&(g<200)&(r-g>45)&(g-b>35)
        eligible_brown=(guide[:,:,3]>220)&(r>35)&(r<150)&(g<110)&(b<100)&(r-g>12)
        olevel=np.ones(visible.shape,dtype=int)
        olevel[g<orange_base-13]=0;olevel[g>orange_base+13]=2
        blevel=np.ones(visible.shape,dtype=int)
        blevel[r<brown_base-12]=0;blevel[r>brown_base+15]=2
        om=orange&eligible_orange;bm=brown&eligible_brown
        out[om,:3]=orange_shades[olevel[om]]
        out[bm,:3]=brown_shades[blevel[bm]]
        Image.fromarray(out).save(build.RUN/f'frames/{state}/frame-{i}.png')
        assert np.array_equal(out[:,:,3],old[:,:,3])
        assert np.array_equal(out[~(orange|brown)],old[~(orange|brown)])
        checks.append({'state':state,'frame':i,'geometry_alpha_exact':True,
            'outside_material_interiors_RGBA_exact':True,
            'changed_pixels':int(np.any(out!=old,axis=2).sum())})
for state in build.WALKS:
    shutil.copy2(build.RUN/f'frames/{state}/frame-1.png',build.RUN/f'frames/{state.replace("_walk","_idle")}/frame-0.png')
build.compose()
m=json.loads((build.RUN/'manifest.json').read_text())
m.update(characterId='red-fox-design-match-v8',shared_rgb_palette='../../palette.json',
         appearance_reference='output/red-fox-design-match-v8/design-reference.png',game_integrated=False)
build.write(build.RUN/'manifest.json',m)
build.write(root/'style-verification.json',{'unique_drawings':checks,
    'shared_orange_RGB':orange_shades.tolist(),'shared_chocolate_RGB':brown_shades.tolist(),
    'palette_unchanged':True,'geometry_and_tail_movement_exact_v6':True,
    'eye_nose_mouth_and_ivory_detail_preserved':True,'live_visual_qa':'pending'})
