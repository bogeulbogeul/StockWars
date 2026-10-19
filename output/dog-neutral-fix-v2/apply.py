"""Replace only diagonal neutral and its shared idle with native standing edit."""
import json
import shutil
from pathlib import Path
import build
from PIL import Image

root=Path(__file__).parent
old=root.parent/'dog-motion-rebuild-v1/dog/run'
record=json.loads((root/'generation.json').read_text(encoding='utf-8'))
(root/'raw').mkdir(exist_ok=True)
shutil.copy2(record['source'],root/'raw/neutral.png')
part=build.getparts('neutral',1)[0]
build.saveframe('right_walk',1,part,340/part.height)
shutil.copy2(build.RUN/'frames/right_walk/frame-1.png',build.RUN/'frames/right_idle/frame-0.png')
build.compose()
# Compare against the preceding design candidate, not the old game atlas.
previous=Image.new('RGBA',(1280,4000))
m=json.loads((build.RUN/'manifest.json').read_text(encoding='utf-8'))
unchanged=0
for state,rects in m['frame_layout']['rows'].items():
    for i,r in enumerate(rects):
        fr=Image.open(old/f'frames/{state}/frame-{i}.png').convert('RGBA')
        previous.paste(fr,(r['x'],r['y']))
        now=Image.open(build.RUN/f'frames/{state}/frame-{i}.png').convert('RGBA')
        if (state,i) not in [('right_walk',1),('right_idle',0)]:
            assert fr.tobytes()==now.tobytes(),(state,i)
            unchanged+=1
previous.save(root/'before.png')
# Rebuild embedded comparison image without altering the other cells.
import base64
html=(root/'preview.html').read_text(encoding='utf-8')
current=base64.b64encode((root/'before.png').read_bytes()).decode()
start=html.index('"before": "data:image/png;base64,')+len('"before": "data:image/png;base64,')
end=html.index('"',start)
html=html[:start]+current+html[end:]
html=html.replace('강아지 · 기본 모션 재설계 시안','강아지 · 사선 중립 자세 수정 v2')
html=html.replace('현재 채택본</small>','이전 시안</small>')
(root/'preview.html').write_text(html,encoding='utf-8')
m['characterId']='dog-neutral-fix-v2'
m['revision']='Only right_walk[1] and shared right_idle[0] replaced; both feet grounded.'
build.write(build.RUN/'manifest.json',m)
build.write(root/'change-verification.json',{'unchanged_logical_frames':unchanged,
    'changed':['right_walk[1]','right_idle[0]'],'A_B_contact_frames_unchanged':True,
    'native_whole_frame_edit':True,'game_installed':False,'live_playback_QA':False})
pair=Image.new('RGB',(640,400),'#eee9df')
for x,p in [(0,old/'frames/right_idle/frame-0.png'),(320,build.RUN/'frames/right_idle/frame-0.png')]:
    im=Image.open(p).convert('RGBA');pair.paste(im,(x,0),im)
pair.save(root/'neutral-comparison.png')
print('Neutral fixed; other 17 logical frames exactly unchanged.')
