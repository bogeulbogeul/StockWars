import base64
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import build

root=Path(__file__).parent
run=build.RUN
old=root.parent/'dog-carry-order-v5/dog/run'
shutil.copy2(root/'baked/shared-rgb.png',run/'frames/right_walk/frame-2.png')
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['characterId']='dog-shoulder-fix-v6'
m['shared_rgb_palette']='../../palette.json'
m['carry_reorder']={'old_v4_indexes':[2,1,0,3],'preserved_from':'dog-carry-order-v5'}
build.write(run/'manifest.json',m)
allowed={tuple(c) for c in json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']}
unchanged=0
for state,rects in m['frame_layout']['rows'].items():
    for i in range(len(rects)):
        path=run/f'frames/{state}/frame-{i}.png'
        a=np.asarray(Image.open(path).convert('RGBA'))
        colors={tuple(c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}
        assert colors<=allowed,(state,i,'RGB mismatch')
        if (state,i)!=('right_walk',2):
            assert path.read_bytes()==(old/f'frames/{state}/frame-{i}.png').read_bytes(),(state,i)
            unchanged+=1
shutil.copy2(old/'sprite-sheet-alpha.png',root/'before.png')
html=(root/'preview.html').read_text(encoding='utf-8')
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start)
html=html[:start]+base64.b64encode((root/'before.png').read_bytes()).decode()+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','강아지 · 사선 어깨 연결 수정 v6')
html=html.replace('현재 채택본</small>','수정 전</small>')
html=html.replace("state.value='down_walk'","state.value='right_walk'")
(root/'preview.html').write_text(html,encoding='utf-8')
pair=Image.new('RGB',(640,400),'#eee9df')
for x,folder in [(0,old),(320,run)]:
    fr=Image.open(folder/'frames/right_walk/frame-2.png').convert('RGBA')
    pair.paste(fr,(x,0),fr)
pair.save(root/'shoulder-comparison.png')
build.write(root/'verification.json',{'changed':['right_walk[2]'],'other_18_frames_byte_identical':unchanged==18,
    'palette_size':len(allowed),'outside_palette_RGB':0,'carry_order_preserved':True,
    'walk_sequence':[0,1,2,1],'frame_ms':160,'game_installed':False,
    'motion_continuity':'experimental; live playback not observed'})
print('Replaced B only, retained 18 frame files and the carry order; shared RGB verified.')
