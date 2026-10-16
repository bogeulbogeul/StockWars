"""Package the six sprite runs and a self-contained animated review page."""
import base64
import json
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from prepare import HERE, IDS, write

NAMES=dict(zip(IDS,['붉은여우','시베리아다람쥐','너구리','유럽오소리','불곰','유럽토끼']))
LABELS={'down_idle':'정면 정지','down_walk':'정면 걷기','right_idle':'사선 정지','right_walk':'사선 걷기','up_idle':'뒤 정지','up_walk':'뒤 걷기','right_carry':'운반','down_sit':'정면 앉기','right_sit':'사선 앉기','face_portrait':'얼굴'}

def main():
 items=[]
 catalog=[]
 for cid in IDS:
  run=HERE/cid/'run'
  if not (run/'manifest.json').exists(): continue
  manifest=json.loads((run/'manifest.json').read_text(encoding='utf-8'))
  sheet=run/'sprite-sheet-alpha.png'
  items.append({'id':cid,'label':NAMES[cid],'limited':cid=='european-rabbit','manifest':manifest,'image':'data:image/png;base64,'+base64.b64encode(sheet.read_bytes()).decode()})
  catalog.append({'id':cid,'name':NAMES[cid],'tier':'limited' if cid=='european-rabbit' else 'regular','sheet':str(sheet.relative_to(HERE)).replace('\\','/'),'manifest':str((run/'manifest.json').relative_to(HERE)).replace('\\','/'),'states':10,'frames':19,'unique_frames':16,'game_integrated':False,'visual_review':'see run/qa-notes.md'})
 write(HERE/'catalog.json',{'theme':'숲속 친구들','sale_period':'one calendar month; start not scheduled','regular_count':5,'limited_count':1,'characters':catalog})
 html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>숲속 친구들 · 스프라이트 검토</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eee9de;color:#302b24;font:16px system-ui}header{padding:26px 32px;background:#fdf9ef;border-bottom:1px solid #d2c7b2}h1{font-size:25px;margin:0 0 8px}p{line-height:1.6;margin:8px 0}.controls{position:sticky;top:0;background:#fdf9efee;padding:12px 28px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:2}select,button{padding:9px;font:inherit;border:1px solid #b6aa91;border-radius:6px;background:white}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px;padding:24px}article{background:#faf7ef;border:1px solid #d9cfbb;border-radius:12px;padding:18px}h2{font-size:20px;margin:0 0 6px}small{color:#756b59}canvas{display:block;width:100%;background:repeating-conic-gradient(#e3dfd6 0% 25%,#eeeae1 0% 50%) 50%/24px 24px;border-radius:8px;margin:12px 0}a{color:#5f6840}.badge{font-size:12px;padding:4px 7px;background:#e4e8d8;border-radius:5px}.limited{background:#eadaad}label{display:flex;align-items:center;gap:7px}footer{padding:12px 32px 30px}</style>
<header><h1>숲속 친구들 · 스프라이트 검토</h1><p>일반 5종 + 한정판 1종 · 공통 10상태 / 19칸 · 정지는 걷기 중립과 동일한 그림</p><small>걷기 A → 중립 → B → 중립 / 160ms. 왼쪽은 오른쪽 반전. 디자인·모션 검토용이며 실제 게임 적용과 가구 접촉 검수 전입니다.</small></header>
<div class="controls"><select id="state"></select><button id="play">멈추기</button><button id="step">한 프레임</button><label>프레임 <input id="frame" type="range" min="0" max="3" value="0"><span id="count">0</span></label><label><input type="checkbox" id="mirror">좌우 반전</label><label><input type="checkbox" id="small">작은 크기</label><label>배경 <input id="bg" type="color" value="#e8e3d7"></label></div><main id="cards"></main><footer>시트 및 manifest는 각 캐릭터 폴더에 보관됩니다. 크기 배율은 시안 비교용이며 H=90 정수리 측정과 실제 접촉 확인은 별도입니다.</footer>
<script>const items=__ITEMS__,labels=__LABELS__,state=document.querySelector('#state'),play=document.querySelector('#play'),slider=document.querySelector('#frame');let playing=true,tick=0,last=0;for(const [k,v]of Object.entries(labels)){const o=new Option(v,k);state.add(o)}state.value='down_walk';for(const it of items){const a=document.createElement('article');a.innerHTML=`<h2>${it.label} <span class="badge ${it.limited?'limited':''}">${it.limited?'한정판':'일반'}</span></h2><canvas width="400" height="310"></canvas><small class="info"></small><p><a href="${it.id}/run/sprite-sheet-alpha.png">투명 시트</a> · <a href="${it.id}/run/manifest.json">manifest</a></p>`;document.querySelector('#cards').append(a);it.ctx=a.querySelector('canvas').getContext('2d');it.info=a.querySelector('.info');it.img=new Image;it.img.src=it.image}
play.onclick=()=>{playing=!playing;play.textContent=playing?'멈추기':'재생'};document.querySelector('#step').onclick=()=>{playing=false;play.textContent='재생';tick++};slider.oninput=()=>{playing=false;play.textContent='재생';tick=+slider.value};state.onchange=()=>{tick=0};function draw(t){if(playing&&t-last>=160){tick++;last=t}const s=state.value;const order=s.endsWith('_walk')?[0,1,2,1]:s==='right_carry'?[0,1,2,3]:[0];slider.max=order.length-1;slider.value=tick%order.length;document.querySelector('#count').textContent=order[tick%order.length];for(const it of items){const c=it.ctx;c.fillStyle=document.querySelector('#bg').value;c.fillRect(0,0,400,310);c.strokeStyle='#b9b09b';c.beginPath();c.moveTo(20,282);c.lineTo(380,282);c.stroke();const i=order[tick%order.length],r=it.manifest.frame_layout.rows[s][i],scale=document.querySelector('#small').checked?.34:.7;c.save();c.translate(200,282);c.scale(document.querySelector('#mirror').checked?-scale:scale,scale);if(it.img.complete&&it.img.naturalWidth)c.drawImage(it.img,r.x,r.y,r.w,r.h,-160,-372,320,400);c.restore();it.info.textContent=`${labels[s]} · 그림 ${i+1} / ${it.manifest.frame_layout.rows[s].length}`;}requestAnimationFrame(draw)}requestAnimationFrame(draw)</script></html>'''
 (HERE/'preview.html').write_text(html.replace('__ITEMS__',json.dumps(items,ensure_ascii=False)).replace('__LABELS__',json.dumps(LABELS,ensure_ascii=False)),encoding='utf-8')
 font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',22)
 small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',16)
 board=Image.new('RGB',(1440,1050),'#eee9de')
 draw=ImageDraw.Draw(board)
 for index,it in enumerate(items):
  x=(index%3)*480;y=(index//3)*525
  draw.text((x+20,y+12),it['label']+(' · 한정판' if it['limited'] else ' · 일반'),font=font,fill='#302b24')
  sheet=Image.open(HERE/it['id']/'run/sprite-sheet-alpha.png').convert('RGBA')
  for k,s in enumerate(['down_walk','right_walk','up_walk','right_carry','down_sit','face_portrait']):
   r=it['manifest']['frame_layout']['rows'][s][1 if s.endswith('_walk') else 0]
   thumb=sheet.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])).resize((128,160),Image.Resampling.LANCZOS)
   px=x+22+(k%3)*150;py=y+55+(k//3)*215
   board.paste(thumb,(px,py),thumb)
   draw.text((px,py+163),LABELS[s],font=small,fill='#504638')
 board.save(HERE/'overview.png')
 with zipfile.ZipFile(HERE/'forest-friends-sprites-v1.zip','w',zipfile.ZIP_DEFLATED) as archive:
  for cid in IDS:
   run=HERE/cid/'run'
   for filename in ['sprite-sheet-alpha.png','manifest.json','sprite-request.json','alignment.json','transition-verification.json','playback-verification.json','generation.json','qa-notes.md','visual-review.json','no-paw-pads-verification.json']:
    p=run/filename
    if p.exists():archive.write(p,str(p.relative_to(HERE)))
   for p in (run/'frames').rglob('*.png'):
    archive.write(p,str(p.relative_to(HERE)))
   for p in (run/'qa').glob('*.gif'):
    archive.write(p,str(p.relative_to(HERE)))
  for filename in ['catalog.json','preview.html','overview.png','verification.json','preview-verification.json']:
   archive.write(HERE/filename,filename)
 print('Packaged',len(items),'characters',flush=True)

if __name__=='__main__':main()
