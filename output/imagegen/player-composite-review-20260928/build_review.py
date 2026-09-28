from pathlib import Path
import base64, json, struct

root = Path('C:/GitHub/StockWars/output/imagegen')
files = [
 ('뒤 헤어', root/'player-hair-short-black-20260928/hair_short_back_idle_down.png'),
 ('몸체', Path('C:/Users/Administrator/Videos/Downloads/ChatGPT 이미지 2026년 9월 28일 오후 02_13_32.png')),
 ('반바지', root/'player-outfit-white-black-20260928/bottom_shorts_black_idle_down.png'),
 ('신발', root/'player-shoes-black-20260928/shoes_basic_black_idle_down.png'),
 ('반팔', root/'player-outfit-white-black-20260928/top_tshirt_white_idle_down.png'),
 ('얼굴', root/'player-face-black-20260928/face_default_idle_down.png'),
 ('앞 헤어', root/'player-hair-short-black-20260928/hair_short_front_idle_down.png'),
]
layers=[]
for name,path in files:
 data=path.read_bytes()
 w,h=struct.unpack('>II',data[16:24])
 layers.append(dict(name=name,path=str(path),w=w,h=h,src='data:image/png;base64,'+base64.b64encode(data).decode()))
html='''<!doctype html><meta charset="utf-8"><title>StockWars 합성 검수</title>
<style>body{margin:24px;background:#edf0f4;color:#202631;font:15px system-ui}h1{font-size:24px}main{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}.board{position:relative;width:611px;height:644px;background-color:#ddd;background-image:conic-gradient(#eee 25%,transparent 0 50%,#eee 0 75%,transparent 0);background-size:24px 24px;overflow:hidden}.stack{width:1222px;height:1288px;transform:scale(.5);transform-origin:top left}.stack img{position:absolute;top:0;left:0;image-rendering:pixelated}aside{max-width:670px}label{display:block;margin:9px 0}button{padding:8px;margin:4px}table{border-collapse:collapse;font-size:12px}td,th{padding:6px;border-bottom:1px solid #c4cbd5;text-align:left}pre{white-space:pre-wrap;background:white;padding:12px}.thumb{position:relative;overflow:hidden;background:#dbe3ed;display:inline-block;margin:10px;width:122px;height:129px}.thumb .stack{transform:scale(.1)}small{display:block}</style>
<h1>StockWars · 정면 정지 원본 합성 검수</h1><p>좌상단 (0,0) 원점 · 원본 크기 그대로 겹침 · 자동 정렬/트리밍/리샘플링 없음 · 큰 화면은 50% 표시</p>
<main><div><div class="board"><div class="stack" id="stack"></div></div><div class="thumb"><div class="stack" id="thumb"></div></div><small>작은 비교 화면: 원본의 10% 표시. 실제 게임 해상도 확정값 아님.</small></div><aside><div id="controls"></div><button id="all">전체</button><button id="nohair">헤어 숨김</button><button id="clothes">몸체 + 의상</button><button id="face">몸체 + 얼굴</button><table><thead><tr><th>레이어</th><th>크기</th><th>불투명 영역 경계*</th><th>반투명 픽셀</th></tr></thead><tbody id="stats"></tbody></table><small>*알파 128 이상, 좌상단/우하단 좌표 포함</small><pre id="metrics">분석 중…</pre></aside></main>
<script>const layers=DATA;
const stack=document.querySelector('#stack'),thumb=document.querySelector('#thumb');
function show(ids){document.querySelectorAll('input').forEach((e,i)=>{e.checked=ids.includes(i);change(i,e.checked)})}
function change(i,v){document.querySelectorAll('[data-layer="'+i+'"]').forEach(e=>e.style.display=v?'block':'none')}
layers.forEach((l,i)=>{for(const p of [stack,thumb]){const img=new Image();img.src=l.src;img.dataset.layer=i;p.append(img)}const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=true;check.onchange=()=>change(i,check.checked);label.append(check,document.createTextNode(l.name));document.querySelector('#controls').append(label)});
document.querySelector('#all').onclick=()=>show([0,1,2,3,4,5,6]);document.querySelector('#nohair').onclick=()=>show([1,2,3,4,5]);document.querySelector('#clothes').onclick=()=>show([1,2,3,4]);document.querySelector('#face').onclick=()=>show([1,5]);
const W=1222,H=1288;
Promise.all(layers.map(async(l)=>{const img=new Image();img.src=l.src;await img.decode();const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0,partial=0,n=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=d[(y*W+x)*4+3];if(a>0&&a<255)partial++;if(a>=128){n++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}}document.querySelector('#stats').insertAdjacentHTML('beforeend',`<tr><td>${l.name}</td><td>${l.w}×${l.h}</td><td>${x0},${y0}–${x1},${y1}</td><td>${partial}</td></tr>`);return {d,n,bounds:[x0,y0,x1,y1],partial};})).then(a=>{function covered(idx,cover,rect){let total=0,hit=0;for(let y=rect[1];y<=rect[3];y++)for(let x=rect[0];x<=rect[2];x++){let p=(y*W+x)*4+3;if(a[idx].d[p]>=128){total++;if(a[cover].d[p]>=128)hit++}}return `${hit}/${total} (${(hit/total*100).toFixed(1)}%)`}
const result={faceCoveredByHair:covered(5,6,[0,0,W-1,H-1]),leftEyeCovered:covered(5,6,[417,545,560,665]),rightEyeCovered:covered(5,6,[663,545,804,665]),shortsCoveredByShirt:covered(2,4,[0,0,W-1,H-1]),bodyBottom:a[1].bounds[3],shoeBottom:a[3].bounds[3],layers:a.map((v,i)=>({name:layers[i].name,size:[layers[i].w,layers[i].h],bounds:v.bounds,partialAlpha:v.partial}))};document.querySelector('#metrics').textContent=JSON.stringify(result,null,2);window.reviewResult=result;});
</script>'''.replace('DATA',json.dumps(layers,ensure_ascii=False))
Path(__file__).with_name('review.html').write_text(html,encoding='utf-8')
print('Created review.html with embedded original layers')
