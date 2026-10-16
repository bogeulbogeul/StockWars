"""Reorder existing carry drawings exactly as the user's four references."""
import base64
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw
import build

root=Path(__file__).parent
old=root.parent/'dog-diagonal-walk-v4/dog/run'
run=build.RUN
order=[2,1,0,3]
for new_i,old_i in enumerate(order):
    shutil.copy2(old/f'frames/right_carry/frame-{old_i}.png',run/f'frames/right_carry/frame-{new_i}.png')
build.compose()
m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
m['characterId']='dog-carry-order-v5'
m['carry_reorder']={'source':'dog-diagonal-walk-v4','old_indexes':order,'user_attachment_order':[1,2,3,4]}
m['shared_rgb_palette']='../../palette.json'
build.write(run/'manifest.json',m)
unchanged=0
for state,rects in m['frame_layout']['rows'].items():
    for i in range(len(rects)):
        j=order[i] if state=='right_carry' else i
        a=(old/f'frames/{state}/frame-{j}.png').read_bytes()
        b=(run/f'frames/{state}/frame-{i}.png').read_bytes()
        assert a==b,(state,i,'pixel/file changed')
        unchanged+=1
shutil.copy2(old/'sprite-sheet-alpha.png',root/'before.png')
html=(root/'preview.html').read_text(encoding='utf-8')
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start)
html=html[:start]+base64.b64encode((root/'before.png').read_bytes()).decode()+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','강아지 · 운반 순서 수정 v5')
html=html.replace('현재 채택본</small>','이전 순서</small>')
html=html.replace("state.value='down_walk'","state.value='right_carry'")
html=html.replace('양발 교대 + 같은 쪽 팔·다리 반대 방향.','운반은 첨부한 1 → 2 → 3 → 4 순서로 재배열했습니다. 그림·RGB·프레임 시간은 유지합니다.')
(root/'preview.html').write_text(html,encoding='utf-8')
board=Image.new('RGB',(1280,420),'#eee9df');d=ImageDraw.Draw(board)
for i in range(4):
    im=Image.open(run/f'frames/right_carry/frame-{i}.png').convert('RGBA')
    board.paste(im,(i*320,20),im)
    d.text((i*320+12,5),f'Attachment {i+1} / previous frame {order[i]+1}',fill='black')
board.save(root/'carry-order.png')
build.write(root/'verification.json',{'old_frame_order_1_based':[3,2,1,4],
    'new_sequence':[0,1,2,3],'durations_ms':[160]*4,'all_19_logical_frame_files_preserved':unchanged==19,
    'redraw':False,'recolor':False,'game_installed':False})
print('Carry order: old 3 -> 2 -> 1 -> 4. All 19 frame files byte-identical to their sources.')
