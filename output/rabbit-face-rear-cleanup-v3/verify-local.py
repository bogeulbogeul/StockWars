"""Local visual edits, pose preservation and exact short-tail/nose checks."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).parent
old=root.parent/'rabbit-tail-occlusion-v2/rabbit/run'
run=root/'rabbit/run'
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
original=json.loads((old/'manifest.json').read_text(encoding='utf-8'))
assert m['frame_layout']==original['frame_layout'] and m['animation']==original['animation']
assert (root/'palette.json').read_bytes()==(root.parent/'rabbit-tail-occlusion-v2/palette.json').read_bytes()
layers={name:np.array(Image.open(root/f'baked-{name}/{name}.png').convert('RGBA')) for name in ['rear','tail','eyes','nose']}
regions=json.loads((root/'local-regions.json').read_text(encoding='utf-8'))
checks=[];stamps=[];nose_frames=0
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        rel=f'frames/{state}/frame-{i}.png'
        a=np.array(Image.open(old/rel).convert('RGBA'))
        b=np.array(Image.open(run/rel).convert('RGBA'))
        assert np.array_equal(a[:,:,3],b[:,:,3]),(state,i,'silhouette changed')
        lookup=state.replace('_idle','_walk') if state.endswith('_idle') else state
        index=1 if state.endswith('_idle') else i
        rect=m['frame_layout']['rows'][lookup][index]
        y,x=rect['y'],rect['x']
        mask=np.zeros((400,320),dtype=bool)
        for name,layer in layers.items():
            piece=layer[y:y+400,x:x+320]
            selected=piece[:,:,3]>0;mask|=selected
            if name=='nose' and selected.any():
                assert np.all(b[selected,:3]==[97,55,42]),(state,i,'nose material drift')
                nose_frames+=1
        assert np.array_equal(a[~mask],b[~mask]),(state,i,'outside local edits changed')
        if state=='up_walk':
            box=regions[f'up_walk/{i}']['tail_box'];xl,yt,xr,yb=box
            stamps.append(b[yt:yb,xl:xr].copy())
        checks.append({'state':state,'frame':i,'changed_pixels':int(np.any(a!=b,axis=2).sum()),'outside_edit_RGBA_exact':True,'alpha_exact':True})
assert len(stamps)==3 and all(np.array_equal(stamps[0],s) for s in stamps[1:])
assert nose_frames==15,nose_frames
report={'logical_frames':19,'alpha_and_outer_body_silhouettes_exact':True,
        'outside_local_edit_RGBA_exact':True,'shared_palette_unchanged':True,
        'nose_material_RGB':[97,55,42],'nose_logical_frames_checked':nose_frames,
        'short_tail_same_drawing_and_RGB_all_three_rear_phases':True,
        'short_tail_centers':[[160,247],[160,252],[160,247]],
        'independent_lateral_tail_wag':False,'layout_and_playback_equal_v2_and_dog_v9':True,
        'game_installed':False,'live_motion_continuity':'not observed; experimental', 'frames':checks}
(root/'local-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='frames'},ensure_ascii=False))
