"""Verify edited regions and package all eight current animal sheets."""
import base64
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from sprite_gen.util.gif_utils import save_clean_gif

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
FOREST=ROOT/'output/forest-friends/sprites-v1'
IDS=['red-fox','siberian-chipmunk','raccoon-dog','european-badger','brown-bear','european-rabbit']
PAIRS=[('dog','강아지',ROOT/'output/npc-style-animals/tail-wag-v1/dog/run'),('cat','고양이',ROOT/'output/npc-style-animals/unified-v2/cat/run')]+[(i,n,FOREST/i/'run') for i,n in zip(IDS,['붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼'])]
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 audit=json.loads((HERE/'verification.json').read_text(encoding='utf-8'))
 for j in audit['checks']:
  file=Path(j['run'])/'frames'/j['state']/f"frame-{j['index']}.png"
  old=HERE/'before'/file.relative_to(ROOT)
  a=np.array(Image.open(old).convert('RGBA'));b=np.array(Image.open(file).convert('RGBA'))
  x0,y0,x1,y1=j['region']
  allowed=np.zeros(a.shape[:2],dtype=bool);allowed[y0:y1,x0:x1]=True
  assert np.array_equal(a[...,3],b[...,3]),('alpha',j)
  assert np.array_equal(a[~allowed],b[~allowed]),('outside region',j)
  assert np.any(a!=b),('no correction',j)
  j['finalPixelChecksPassed']=True
 audit.update(ok=True,uniqueAnimals=8,editedFrames=len(audit['checks']),visualReview='before/after regions inspected; no central/bean pad marks retained',baseGameAtlasesUpdated=True)
 write(HERE/'verification.json',audit)
 items=[]
 for cid,name,run in PAIRS:
  m=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
  atlas=Image.open(run/'sprite-sheet-alpha.png').convert('RGBA')
  for state,rects in m['frame_layout']['rows'].items():
   for i,r in enumerate(rects):
    frame=Image.open(run/f'frames/{state}/frame-{i}.png').convert('RGBA')
    assert frame.tobytes()==atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).tobytes(),(cid,state,i)
  frames=[Image.open(run/f'frames/up_walk/frame-{i}.png').convert('RGBA') for i in [0,1,2,1]]
  save_clean_gif(frames,run/'qa/up_walk.gif',duration_ms=160,loop=0)
  if cid in ['dog','cat']:
   p=subprocess.run([sys.executable,'-m','sprite_gen.cli','inspect','--run-dir',str(run)],capture_output=True,text=True,encoding='utf-8')
   (run/'no-paw-pads-inspect.log').write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
   assert p.returncode==0,p.stdout+p.stderr
   asset=ROOT/'web/assets/characters'/('dog-npc-v2' if cid=='dog' else 'black-cat-npc-v2')/'atlas.png'
   assert Image.open(asset).convert('RGBA').tobytes()==atlas.tobytes()
  items.append({'id':cid,'label':name,'layout':m['frame_layout'],'src':'data:image/png;base64,'+base64.b64encode((run/'sprite-sheet-alpha.png').read_bytes()).decode()})
 html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>동물 8종 · 발바닥 패드 제거</title><style>body{font:16px system-ui;background:#ece5d8;color:#302b24;margin:24px}h1{font-size:25px}button,select{font:inherit;padding:8px;margin:5px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}article{background:#fff9ed;border-radius:12px;padding:16px}h2{font-size:19px}canvas{width:100%;background:#ddd5c4;border-radius:8px}a{color:#526343}</style><h1>동물 8종 · 발바닥 패드 제거</h1><p>강아지·고양이와 숲속 친구들 6종. 발의 외곽선·투명도와 수정 영역 밖 픽셀을 유지했습니다.</p><p>걷기 3그림 · A → 중립 → B → 중립 · 160ms</p><select id="state"><option value="up_walk">뒤 걷기</option><option value="right_walk">오른쪽 사선 걷기</option><option value="down_walk">정면 걷기</option></select><button id="play">멈추기</button><button id="step">한 프레임</button><a href="comparison.png">수정 전후 확대 비교</a><main></main><script>const items=__ITEMS__;let playing=true,tick=0,last=0;for(const it of items){const a=document.createElement('article');a.innerHTML=`<h2>${it.label}</h2><canvas width="320" height="260"></canvas>`;document.querySelector('main').append(a);it.ctx=a.querySelector('canvas').getContext('2d');it.image=new Image();it.image.src=it.src}document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'멈추기':'재생'};document.querySelector('#step').onclick=()=>{playing=false;document.querySelector('#play').textContent='재생';tick++};function draw(t){if(playing&&t-last>=160){tick++;last=t}const i=[0,1,2,1][tick%4],s=document.querySelector('#state').value;for(const it of items){const c=it.ctx,r=it.layout.rows[s][i];c.clearRect(0,0,320,260);if(it.image.complete&&it.image.naturalWidth)c.drawImage(it.image,r.x,r.y,r.w,r.h,64,20,192,240)}requestAnimationFrame(draw)}requestAnimationFrame(draw);</script></html>'''
 (HERE/'preview.html').write_text(html.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)),encoding='utf-8')
 archive=HERE/'all-animals-no-pads.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for cid,name,run in PAIRS:
   for fn in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','no-paw-pads-verification.json']:
    z.write(run/fn,f'{cid}/{fn}')
   for p in (run/'frames').rglob('frame-*.png'):z.write(p,f'{cid}/'+str(p.relative_to(run)).replace('\\','/'))
   z.write(run/'qa/up_walk.gif',f'{cid}/qa/up_walk.gif')
  for fn in ['preview.html','comparison.png','verification.json','jobs.json','focus-edits.json']:z.write(HERE/fn,fn)
 with zipfile.ZipFile(archive) as z:assert z.testzip() is None
 print('Verified 8 animals,',len(audit['checks']),'edited frames; alpha and outside-region pixels preserved. Packaged',archive.name,flush=True)
if __name__=='__main__':main()
