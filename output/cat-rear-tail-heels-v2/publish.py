import base64
import json
import shutil
from pathlib import Path
from PIL import Image,ImageDraw
import build

root=Path(__file__).parent
run=build.RUN
old=root.parent/'cat-dog-baseline-v1/cat/run'
row=Image.open(root/'baked/shared-rgb.png').convert('RGBA')
for i in range(3):
    row.crop((i*320,0,(i+1)*320,400)).save(run/f'frames/up_walk/frame-{i}.png')
shutil.copy2(run/'frames/up_walk/frame-1.png',run/'frames/up_idle/frame-0.png')
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['characterId']='cat-rear-tail-heels-v2'
m['shared_rgb_palette']='../../palette.json'
build.write(run/'manifest.json',m)
unchanged=0
for state,rects in m['frame_layout']['rows'].items():
    for i in range(len(rects)):
        if state not in ['up_walk','up_idle']:
            assert (run/f'frames/{state}/frame-{i}.png').read_bytes()==(old/f'frames/{state}/frame-{i}.png').read_bytes(),(state,i)
            unchanged+=1
assert unchanged==15
shutil.copy2(old/'sprite-sheet-alpha.png',root/'before.png')
html=(root/'preview.html').read_text(encoding='utf-8')
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start)
html=html[:start]+base64.b64encode((root/'before.png').read_bytes()).decode()+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','고양이 · 뒤 꼬리 연결·뒤꿈치 수정 v2')
html=html.replace('현재 채택본</small>','수정 전</small>').replace('재설계 시안</small>','수정 후</small>')
html=html.replace('dog/run/','cat/run/').replace('dog/review-final.png','cat/review-final.png')
html=html.replace("state.value='down_walk'","state.value='up_walk'")
(root/'preview.html').write_text(html,encoding='utf-8')
board=Image.new('RGB',(960,840),'#eee9df');d=ImageDraw.Draw(board)
for y,folder in [(0,old),(420,run)]:
    for i in range(3):
        im=Image.open(folder/f'frames/up_walk/frame-{i}.png').convert('RGBA')
        board.paste(im,(i*320,y+20),im)
        d.text((i*320+10,y+5),('BEFORE' if y==0 else 'AFTER')+f' / {i}',fill='black')
board.save(root/'rear-comparison.png')
build.write(root/'change-verification.json',{'changed':['up_walk[0]','up_walk[1]','up_walk[2]','up_idle[0]'],
    'other_15_frame_files_identical':True,'palette_unchanged':True,'game_installed':False})
print('Rear walk and shared idle replaced; other 15 frame files preserved.')
