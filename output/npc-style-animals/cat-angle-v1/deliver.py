import base64, hashlib, json, re, shutil, subprocess
from pathlib import Path

HERE=Path(__file__).parent.resolve(); ROOT=HERE.parents[2]
OLD=ROOT/'output/npc-style-animals/motions-v2/cat/run'; RUN=HERE/'run'
GAME=ROOT/'web/assets/characters/black-cat-npc-v2'
before=HERE/'before'; before.mkdir(exist_ok=True)
for name in ('sprite-sheet-alpha.png','manifest.json','sprite-request.json'):
    if not (before/name).exists():shutil.copy2(OLD/name,before/name)
if not (before/'right_walk').exists():shutil.copytree(OLD/'frames/right_walk',before/'right_walk')
for name in ('atlas.png','manifest.json'):
    if not (before/('game-'+name)).exists():shutil.copy2(GAME/name,before/('game-'+name))
for name in ('sprite-sheet-alpha.png','sprite-sheet-alpha.report.json','manifest.json','sprite-request.json'):
    shutil.copy2(RUN/name,OLD/name)
shutil.copytree(RUN/'frames/right_walk',OLD/'frames/right_walk',dirs_exist_ok=True)
shutil.copy2(RUN/'frames/frames-manifest.json',OLD/'frames/frames-manifest.json')
shutil.copy2(RUN/'raw/right_walk.png',OLD/'raw/right_walk.png')
for suffix in ('-contact.png','.gif'):
    shutil.copy2(RUN/('qa/right_walk'+suffix),OLD/('qa/right_walk'+suffix))
shutil.copy2(RUN/'sprite-sheet-alpha.png',GAME/'atlas.png')
shutil.copy2(RUN/'manifest.json',GAME/'manifest.json')
# Refresh only the cat atlas embedded in the established self-contained preview.
p=OLD.parent.parent/'preview.html'
html=p.read_text(encoding='utf-8-sig')
start=html.index('const data=')+len('const data=')
decoder=json.JSONDecoder(); data,end=decoder.raw_decode(html[start:])
for item in data:
    if item['id']=='cat':
        item['manifest']=json.loads((RUN/'manifest.json').read_text(encoding='utf-8'))
        for key,value in item.items():
            if isinstance(value,str) and value.startswith('data:image/png;base64,'):
                item[key]='data:image/png;base64,'+base64.b64encode((RUN/'sprite-sheet-alpha.png').read_bytes()).decode()
p.write_text(html[:start]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+html[start+end:],encoding='utf-8')
def frames(folder):
    return ['data:image/png;base64,'+base64.b64encode(f.read_bytes()).decode() for f in sorted(folder.glob('frame-*.png'))]
payload={'dog':frames(ROOT/'output/npc-style-animals/motions-v2/dog/run/frames/right_walk'),'old':frames(before/'right_walk'),'cat':frames(RUN/'frames/right_walk')}
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>옆 걷기 각도 통일</title><style>body{font:16px system-ui;background:#eeece5;color:#2c302d;padding:28px}h1{font-size:24px}main{display:flex;flex-wrap:wrap;gap:20px}article{padding:20px;background:white;border-radius:16px;text-align:center}canvas{width:240px;height:300px;background:#f4efdf;border-bottom:2px solid #b7ab91}button,label{margin:12px 12px 24px 0;padding:8px;font:inherit}small{display:block;margin-top:10px}a{color:#23666a}</style><h1>강아지 기준으로 고양이 옆 걷기 각도 통일</h1><p>두 눈과 앞가슴이 보이는 사선 측면 · 3프레임 · A→중립→B→중립 · 프레임당 160ms</p><button id="play">일시정지</button><button id="step">다음 자세</button><label><input id="mirror" type="checkbox">왼쪽 반전</label><main></main><p><a href="run/sprite-sheet-alpha.png">수정된 고양이 전체 투명 시트</a> · <a href="run/qa/right_walk-contact.png">3자세 확인</a></p><script>const data=PAYLOAD;const cards=[];let phase=0,paused=false,last=0;for(const [id,label]of [['dog','강아지 · 각도 기준'],['old','고양이 · 수정 전'],['cat','고양이 · 수정 후']]){const a=document.createElement('article');a.innerHTML='<h2>'+label+'</h2><canvas width="320" height="400"></canvas><small></small>';document.querySelector('main').append(a);cards.push({el:a,ctx:a.querySelector('canvas').getContext('2d'),images:data[id].map(src=>{const i=new Image;i.src=src;return i})})}document.querySelector('#play').onclick=()=>{paused=!paused;document.querySelector('#play').textContent=paused?'재생':'일시정지'};document.querySelector('#step').onclick=()=>{paused=true;phase=Math.floor(phase)+1;document.querySelector('#play').textContent='재생'};function draw(t){if(last&&!paused)phase+=(t-last)/160;last=t;const n=[0,1,2,1][Math.floor(phase)%4];for(const card of cards){const c=card.ctx;c.clearRect(0,0,320,400);c.save();if(document.querySelector('#mirror').checked){c.translate(320,0);c.scale(-1,1)}if(card.images[n].complete&&card.images[n].naturalWidth)c.drawImage(card.images[n],0,0);c.restore();card.el.querySelector('small').textContent=['접지 A','중립','반대 접지 B'][n]}requestAnimationFrame(draw)}requestAnimationFrame(draw);</script></html>'''
(HERE/'preview.html').write_text(html.replace('PAYLOAD',json.dumps(payload)),encoding='utf-8')
(HERE/'README.md').write_text('''# 고양이 옆 걷기 각도 통일 — 2026-10-16

사용자 요청으로 고양이 right_walk만 강아지의 앞오른쪽 사선 측면에 맞췄다. 양 눈·앞가슴이 보이는 각도, 3자세 A/중립/B, 0→1→2→1과160ms를 유지한다. 왼쪽은 기존 공통 렌더러에서 반전한다. 정지·운반·앉기·앞/뒤 걷기는 변경하지 않았다.

참고 역할: 현재 cat right_idle은 외형·차콜 색·체형 기준; 현재 dog right_walk의 0/1/2는 카메라와 자세 기준이다. 내장 image_gen으로 단일 3자세 행 생성 → sprite-gen canonical extract → compose-atlas/preview/inspect. 원래 프레임 및 추출 기록을 가져와 바뀐 행만 재추출했다. 다른 상태 PNG는 바이트 동일 검증했다. 이전 시트·게임 에셋·옆걷기 프레임은 before/에 보존했다.

motions-v2 최신 시트·프레임·manifest·기존 비교 화면 및 게임 black-cat-npc-v2 atlas/manifest를 갱신했다. [각도 비교](preview.html). 자동 추출·조합·정적 시각 확인은 완료했으며 실제 게임 이동·가구 접촉의 최종 시각 검수는 별도다.
''',encoding='utf-8')
print('Updated source, game atlas, and both previews; backups preserved.')
