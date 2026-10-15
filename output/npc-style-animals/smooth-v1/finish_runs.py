import base64, hashlib, json, subprocess
from pathlib import Path

HERE=Path(__file__).parent
OLD=HERE.parent/'motions-v2'
CLI=Path(r'C:\Users\bogeu\.codex\skills\sprite-gen\.venv\Scripts\sprite-gen.exe')
moving=('down_walk','right_walk','up_walk','right_carry')
payload={}
for animal in ('dog','cat'):
    run=HERE/animal/'run'
    path=run/'frames/frames-manifest.json'
    new=json.loads(path.read_text(encoding='utf-8-sig'))
    old=json.loads((OLD/animal/'run/frames/frames-manifest.json').read_text(encoding='utf-8-sig'))
    existing={r['state']:r for r in old['rows'] if r['state'] not in moving}
    rows={r['state']:r for r in new['rows']}
    rows.update(existing)
    req=json.loads((run/'sprite-request.json').read_text(encoding='utf-8-sig'))
    new['rows']=[rows[s] for s in req['states']]
    new['imports']={'unchanged_states':list(existing),'source':str(OLD/animal/'run'),'method':'Copied existing approved PNG frames and their canonical extraction records; new motion rows extracted with sprite-gen.'}
    path.write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
    for verb in ('compose-atlas','preview','inspect'):
        proc=subprocess.run([str(CLI),verb,'--run-dir',str(run)],capture_output=True,text=True)
        (run/f'{verb}.log').write_text(proc.stdout+'\n'+proc.stderr,encoding='utf-8')
        print(animal,verb,proc.returncode)
        if proc.returncode and verb!='inspect':raise RuntimeError(proc.stderr)
    proc=subprocess.run([str(CLI),'compose-gif','--run-dir',str(run),'--out-dir',str(run/'previews')],capture_output=True,text=True)
    (run/'compose-gif.log').write_text(proc.stdout+'\n'+proc.stderr,encoding='utf-8')
    print(animal,'compose-gif',proc.returncode)
    for s in existing:
        for f in (run/'frames'/s).glob('frame-*.png'):
            assert f.read_bytes()==(OLD/animal/'run/frames'/s/f.name).read_bytes()
    payload[animal]={}
    for s in moving:
        payload[animal][s]={}
        for version,base in [('old',OLD/animal/'run'),('new',run)]:
            files=sorted((base/'frames'/s).glob('frame-*.png'),key=lambda p:int(p.stem.split('-')[-1]))
            payload[animal][s][version]=['data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in files]
    (run/'qa-notes.md').write_text('''# Smooth motion comparison — 2026-10-15

Native image_gen GPT generation, no Grok/OpenAI paid API. Eight figures per new row; canonical sprite-gen extract/compose-atlas/preview/compose-gif/inspect. Both characters: front/right/back walk and right carry, 8 frames at 80ms (640ms cycle). Left uses runtime horizontal mirror as existing baseline. Standing and seated PNGs are copied byte-for-byte with their existing canonical extraction records; this import of approved states is the only manual manifest merge.

First rows had repeated half cycles; seven rows regenerated with explicit screen/near/far foot instructions and existing motion contacts. Those contact sheets can contain older six-pose trials; identity uses the current accepted directional PNG. Rejected first raw rows remain in rejected-v1. No manual painting, skeleton animation or frame retiming to conceal failed motion.

Motion verdict: EXPERIMENTAL, not passed as final game-ready locomotion. New intermediate silhouettes exist and all frames extract, but some adjacent poses are close duplicates. Near/far support leg alternation is still ambiguous in side walk and carry, front tail position can jump, and generated shading/face details are not pixel-identical to baseline. No final smoothness improvement claim. Use preview.html for equal 640ms-cycle comparison and frame-by-frame inspection. Actual moving foot contact and furniture/cargo attachment are unverified. Existing game assets and approved baseline remain unchanged.
''',encoding='utf-8')

html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>강아지·고양이 모션 비교</title>
<style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#eef1f4;color:#24313c;font:16px system-ui}h1{font-size:25px;margin:0 0 12px}p{line-height:1.7;max-width:1000px}.controls{position:sticky;top:0;background:#fff;padding:15px;border-radius:12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;z-index:2}button,select{font:inherit;padding:7px 12px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:20px;margin-top:20px}section{background:white;border-radius:16px;padding:20px}h2{margin:0 0 15px;font-size:20px}.pair{display:flex;gap:12px}.card{flex:1;text-align:center}.stage{height:285px;display:flex;justify-content:center;align-items:flex-end;background:linear-gradient(#f4eee2,#e0d5bf);border-bottom:2px solid #8f8574}canvas{width:216px;height:270px}.status{font-size:13px;color:#89551d;margin-top:12px}a{color:#176467}label{display:flex;align-items:center;gap:7px}input[type=range]{width:160px}</style>
<h1>강아지·고양이 모션 비교</h1><p>기존 걷기 3그림과 새 8프레임 시안을 같은 한 주기 0.64초로 비교합니다. 운반은 기존 4그림입니다. 정지·앉기는 기존 그림을 유지했습니다. <b>검토용 시안:</b> 일부 자세 반복·양발 구분·꼬리 위치 변화가 남아 있어 최종 모션으로 채택하지 않았습니다.</p>
<div class="controls"><label>동작 <select id="state"><option value="down_walk">앞 걷기</option><option value="right_walk" selected>오른쪽 걷기</option><option value="up_walk">뒤 걷기</option><option value="right_carry">운반 걷기</option></select></label><button id="play">일시정지</button><button id="step">한 프레임</button><label>속도 <select id="speed"><option value="0.5">0.5배</option><option value="1" selected>1배</option><option value="1.5">1.5배</option></select></label><label>단계 <input id="phase" type="range" min="0" max="7" step="1" value="0"></label><label><input type="checkbox" id="mirror">좌우 반전</label><span id="readout"></span></div>
<main id="main"></main><p><a href="dog/run/sprite-sheet-alpha.png">강아지 투명 시트</a> · <a href="cat/run/sprite-sheet-alpha.png">고양이 투명 시트</a> · <a href="dog/run/manifest.json">강아지 프레임 정보</a> · <a href="cat/run/manifest.json">고양이 프레임 정보</a></p>
<script>const data=PAYLOAD;const imgs={};let running=true,t=0,last=0;const canvases={};
for(const animal of ['dog','cat']){imgs[animal]={};for(const s in data[animal]){imgs[animal][s]={};for(const v of ['old','new'])imgs[animal][s][v]=data[animal][s][v].map(src=>{let im=new Image;im.src=src;return im})}let sec=document.createElement('section');sec.innerHTML=`<h2>${animal==='dog'?'강아지':'검은 고양이'}</h2><div class="pair"><div class="card"><p>기존</p><div class="stage"><canvas width="320" height="400"></canvas></div><small class="old-info"></small></div><div class="card"><p>새 8프레임 시안</p><div class="stage"><canvas width="320" height="400"></canvas></div><small class="new-info"></small></div></div><div class="status">검토용: 양발 교대·접지·첫/끝 연결을 확인해주세요.</div>`;document.querySelector('main').append(sec);canvases[animal]=[...sec.querySelectorAll('canvas')];}
function draw(){let s=document.querySelector('#state').value,ph=Math.floor((t%640)/80),flip=document.querySelector('#mirror').checked;document.querySelector('#phase').value=ph;document.querySelector('#readout').textContent=`새 프레임 ${ph+1}/8`;for(const a of ['dog','cat'])for(let k=0;k<2;k++){let v=k?'new':'old',arr=imgs[a][s][v],i=k?ph:s==='right_carry'?Math.floor((t%640)/160):[0,1,2,1][Math.floor((t%640)/160)];let c=canvases[a][k],ctx=c.getContext('2d');ctx.clearRect(0,0,320,400);ctx.save();if(flip){ctx.translate(320,0);ctx.scale(-1,1)}ctx.drawImage(arr[i],0,0);ctx.restore();c.closest('.card').querySelector('small').textContent=`프레임 ${i+1}/${arr.length} · ${k?80:160}ms`;}}
document.querySelector('#play').onclick=()=>{running=!running;document.querySelector('#play').textContent=running?'일시정지':'재생'};document.querySelector('#step').onclick=()=>{running=false;document.querySelector('#play').textContent='재생';t=(Math.floor(t/80)+1)*80;draw()};document.querySelector('#phase').oninput=e=>{running=false;document.querySelector('#play').textContent='재생';t=Number(e.target.value)*80;draw()};document.querySelector('#state').onchange=()=>{t=0;draw()};document.querySelector('#mirror').onchange=draw;function loop(now){if(running)t+=(last?now-last:0)*Number(document.querySelector('#speed').value);last=now;if(Object.values(imgs).every(a=>Object.values(a).every(s=>Object.values(s).every(v=>v.every(i=>i.complete&&i.naturalWidth)))))draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);</script></html>'''
(HERE/'preview.html').write_text(html.replace('PAYLOAD',json.dumps(payload)),encoding='utf-8')
(HERE/'README.md').write_text('''# 강아지·고양이 부드러운 모션 비교 시안

2026-10-15. 두 캐릭터의 앞·오른쪽·뒤 걷기와 오른쪽 운반을 8프레임/80ms로 직접 생성·추출한 비교 패키지다. 각 시트는 320×400 셀, 8열×9행, 2560×3600 PNG이며 정지·앉기는 기존 승인본을 유지한다.

[재생 비교](preview.html), [강아지 시트](dog/run/sprite-sheet-alpha.png), [고양이 시트](cat/run/sprite-sheet-alpha.png). manifest와 투명 개별 프레임, GIF, 접촉 시트, 자동 검사 보고서 및 각 qa-notes.md를 함께 보존한다.

상태는 **experimental**이다. 생성·추출 성공과 모션 품질 합격을 구분한다. 일부 반복 자세·양발 구분·꼬리 위치·외형 미세 변화가 남아 있고 실제 게임 접지·가구·화물 검증은 미완료다. 기존 채택 기준 및 게임 에셋은 교체하지 않았다. 리깅과 유료 API는 사용하지 않았다.
''',encoding='utf-8')
print('Wrote self-contained preview')
