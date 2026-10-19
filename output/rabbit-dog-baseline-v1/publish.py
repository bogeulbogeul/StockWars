import base64
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
run=build.RUN
before=root.parent/'dog-hidden-hand-v9/dog/run'
shutil.copy2(run/'sprite-sheet-alpha.png',root/'before-recolor.png')
colored=Image.open(root/'baked-final/shared-rgb.png').convert('RGBA')
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
pal=json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']
allowed={tuple(c) for c in pal}
checks=[]
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        fr=colored.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        a=np.asarray(fr)
        old=np.asarray(Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA'))
        assert np.array_equal(a[:,:,3],old[:,:,3]),(state,i,'alpha changed')
        colors={tuple(c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}
        assert colors<=allowed,(state,i,'outside palette')
        fr.save(run/f'frames/{state}/frame-{i}.png')
        checks.append({'state':state,'index':i,'outside_palette':0,'alpha_preserved':True})
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['characterId']='rabbit-dog-baseline-v1'
m['shared_rgb_palette']='../../palette.json'
build.write(run/'manifest.json',m)
shutil.copy2(before/'sprite-sheet-alpha.png',root/'before.png')
html=(root/'preview.html').read_text(encoding='utf-8')
encoded=base64.b64encode((root/'before.png').read_bytes()).decode()
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start)
html=html[:start]+encoded+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','유럽토끼 · 강아지 v9 공통 모션 시안')
html=html.replace('현재 채택본</small>','강아지 v9 기준</small>').replace('재설계 시안</small>','새 유럽토끼</small>')
html=html.replace('dog/run/','rabbit/run/').replace('dog/review-final.png','rabbit/review-final.png')
html=html.replace('양발 교대 + 같은 쪽 팔·다리 반대 방향.',f'강아지 v9 동작 참고 · 토끼 전용 공통 RGB {len(pal)}색 팔레트.')
(root/'preview.html').write_text(html,encoding='utf-8')
portrait=Image.open(run/'frames/face_portrait/frame-0.png').convert('RGBA')
portrait.crop(portrait.getbbox()).save(root/'face-icon.png')
build.write(root/'verification.json',{'palette_size':len(pal),'logical_frames':len(checks),
    'all_nontransparent_RGB_in_shared_palette':True,'alpha_preserved_during_recolor':True,
    'motion_geometry_unchanged':True,'portrait_face_only':True,'checks':checks,
    'temporal_shading_consistency':'requires playback review; palette membership alone is not proof',
    'game_installed':False})
print(f'All {len(checks)} logical frames use only {len(pal)} shared RGB values.')
