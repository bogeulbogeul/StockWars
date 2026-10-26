const byId=id=>document.getElementById(id);
const clamp=x=>Math.max(0,Math.min(1,x));
const fade=(t,start,length=.45)=>clamp((t-start)/length);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const droplets=Array.from({length:12},(_,i)=>{
 const el=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
 el.setAttribute('rx','1.6');el.setAttribute('ry','2.4');
 el.setAttribute('fill',i%2?'#82b7cc':'#bddae3');
 byId('drops').append(el);return el;
});
let time=0,last=0,paused=false,raf,stage=0,ready=false,completed=false;
const starts=[0,3.4,6,9.5], ends=[3.35,5.95,9.4,12];
const caption=byId('caption');caption.setAttribute('role','button');caption.tabIndex=0;caption.style.cursor='pointer';
const next=event=>{
 if(!ready||completed||(event.type==='keydown'&&(!['Enter',' '].includes(event.key)||event.repeat)))return;
 event.preventDefault();event.stopPropagation();
 if(stage<3){stage++;time=reduced?ends[stage]:starts[stage];last=0;paused=false;cancelAnimationFrame(raf);draw(time);if(!reduced)raf=requestAnimationFrame(tick);}
 else{completed=true;cancelAnimationFrame(raf);draw(12);window.parent.postMessage({type:'seed-planting-complete'},'*');}
};
caption.addEventListener('click',next);caption.addEventListener('keydown',next);
function draw(t){
 byId('pat').style.opacity=fade(t,3.4);
 byId('water').style.opacity=fade(t,6);
 const fall=fade(t,1.6,1.5);
 const sink=fade(t,3,.4);
 byId('seed').style.left=`${54.7+1.7*fall}%`;
 byId('seed').style.top=`${41+6.3*fall+1.3*sink}%`;
 byId('seed').style.opacity=t<3.4?1-sink:0;
 const pouring=t>=6.6&&t<9.5;
 droplets.forEach((el,i)=>{
  const p=((t-6.6)*1.7+i/12)%1;
  el.style.opacity=pouring&&p>=0?String(.85*(1-p*.5)):'0';
  el.setAttribute('cx',String(521+((i%3)-1)*2+38*p));
  el.setAttribute('cy',String(255+16*p*p));
 });
 byId('art').style.transform=reduced?'none':`scale(${1+.012*t/12})`;
 byId('caption').textContent=t<3.4?'작은 씨앗을 조심스럽게 내려놓고…':t<6?'흙을 덮어 살짝 다독여 주었어요.':t<9.5?'물도 조금, 천천히.':'“여기서 함께 자라 보자.”';
 byId('status').textContent=t>=12?'씨앗 심기 완료 · 싹이 나기 전 모습':`씨앗 심기 · ${Math.floor(t)} / 12초 · 무음 시안`;
}
function tick(now){
 if(last&&!paused)time=Math.min(ends[stage],time+Math.min((now-last)/1000,.05));
 last=now;draw(time);
 if(time<ends[stage])raf=requestAnimationFrame(tick);
 else byId('pause').disabled=true;
}
function start(){
 cancelAnimationFrame(raf);stage=0;completed=false;time=0;last=0;paused=false;
 byId('pause').disabled=false;byId('pause').textContent='일시정지';
 raf=requestAnimationFrame(tick);
}
byId('replay').onclick=start;
byId('pause').onclick=()=>{paused=!paused;byId('pause').textContent=paused?'계속 재생':'일시정지';};
Promise.all([...document.images].map(img=>img.decode())).then(()=>{
 byId('replay').disabled=false;ready=true;
 if(reduced){time=ends[stage];draw(time);}else start();
}).catch(()=>{window.parent.postMessage({type:'seed-planting-error'},'*');byId('caption').textContent='이미지를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';});

