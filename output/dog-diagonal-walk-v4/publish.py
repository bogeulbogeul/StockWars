import base64
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
import build

root=Path(__file__).parent
run=build.RUN
old=root.parent/'dog-rgb-face-v3/dog/run'
row=Image.open(root/'baked/shared-rgb.png').convert('RGBA')
for i in [0,2]:
    row.crop((i*320,0,(i+1)*320,400)).save(run/f'frames/right_walk/frame-{i}.png')
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['characterId']='dog-diagonal-walk-v4';m['shared_rgb_palette']='../../palette.json'
build.write(run/'manifest.json',m)
allowed={tuple(c) for c in json.loads((root/'palette.json').read_text(encoding='utf-8'))['rgb']}
unchanged=0
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        a=np.asarray(Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA'))
        colors={tuple(c) for c in np.unique(a[a[:,:,3]>0,:3],axis=0)}
        assert colors<=allowed,(state,i,'unapproved RGB')
        if (state,i) not in [('right_walk',0),('right_walk',2)]:
            b=np.asarray(Image.open(old/f'frames/{state}/frame-{i}.png').convert('RGBA'))
            assert np.array_equal(a,b),(state,i,'unintended change')
            unchanged+=1
shutil.copy2(old/'sprite-sheet-alpha.png',root/'before.png')
html=(root/'preview.html').read_text(encoding='utf-8')
encoded=base64.b64encode((root/'before.png').read_bytes()).decode()
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start);html=html[:start]+encoded+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','강아지 · 사선 짧은 보폭 걷기 v4')
html=html.replace('현재 채택본</small>','이전 사선 걷기</small>')
html=html.replace("state.value='down_walk'","state.value='right_walk'")
(root/'preview.html').write_text(html,encoding='utf-8')
board=Image.new('RGB',(960,840),'#eee9df');d=ImageDraw.Draw(board)
for y,folder in [(0,old),(420,run)]:
    for i in range(3):
        fr=Image.open(folder/f'frames/right_walk/frame-{i}.png').convert('RGBA')
        board.paste(fr,(i*320,y+20),fr)
        d.text((i*320+10,y+5),('BEFORE' if y==0 else 'AFTER')+f' / {i}',fill='black')
board.save(root/'walk-comparison.png')
build.write(root/'verification.json',{'unchanged_logical_frames':unchanged,'changed':['right_walk[0]','right_walk[2]'],
    'palette_size':len(allowed),'outside_palette_pixels':0,'walk_sequence':[0,1,2,1],'frame_ms':160,
    'native_pose_redraw':True,'motion_continuity':'experimental; live playback not observed','game_installed':False})
print(f'Only A/B contacts replaced; {unchanged} other frames RGBA identical; RGB palette fixed.')
