const el=id=>document.getElementById(id);
const clamp=x=>Math.max(0,Math.min(1,x));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const crumbs=Array.from({length:7},(_,i)=>{
 const node=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
 node.setAttribute('rx',String(1.6+i%3));node.setAttribute('ry','1.5');
 node.setAttribute('fill',i%2?'#80502b':'#a66b34');
 el('soil').append(node);return node;
});
let time=0,last=0,paused=false,raf;
function draw(t){
 const growth=clamp((t-1.2)/2);
 const ease=1-Math.pow(1-growth,3);
 const settle=t>3.2?Math.sin((t-3.2)*5)*Math.exp(-(t-3.2)*1.8)*3:0;
 el('sprout').style.opacity=String(clamp(growth*8));
 el('sprout').style.transform=`scale(${.65+.35*ease},${.02+.98*ease}) rotate(${settle}deg)`;
 const p=clamp((t-.8)/1.4);
 crumbs.forEach((node,i)=>{
  const spread=(i-3)*3;
  node.setAttribute('cx',String(564+spread*(.2+p)));
  node.setAttribute('cy',String(269-Math.sin(p*Math.PI)*(3+i%3)));
  node.style.opacity=t>=.8&&t<2.2?String(Math.sin(p*Math.PI)*.9):'0';
 });
 el('caption').textContent=t<1.3?'“어…?”':t<3.5?'흙 사이로 작은 잎 하나가 고개를 내밀었어요.':'“안녕, 작은 싹아.”';
 el('status').textContent=t>=6?'첫 싹 발견 · 재생 완료':`첫 싹 발견 · ${Math.floor(t)} / 6초 · 무음 시안`;
}
function tick(now){
 if(last&&!paused)time=Math.min(6,time+(now-last)/1000);
 last=now;draw(time);
 if(time<6)raf=requestAnimationFrame(tick);else el('pause').disabled=true;
}
function start(){
 cancelAnimationFrame(raf);time=0;last=0;paused=false;
 el('pause').disabled=false;el('pause').textContent='일시정지';
 raf=requestAnimationFrame(tick);
}
el('replay').onclick=start;
el('pause').onclick=()=>{paused=!paused;el('pause').textContent=paused?'계속 재생':'일시정지';};
Promise.all([...document.images].map(img=>img.decode())).then(()=>{
 el('replay').disabled=false;if(reduced){draw(6);}else start();
}).catch(()=>{el('caption').textContent='이미지를 불러오지 못했습니다. 새로고침해 주세요.';});
