import { MAP_PLACES,project,escapeMap as esc } from './MapData.js';
import { mapSVG } from './MapSvg.js';
export function mountMapApp(phone,host,source){
 let selected=null,target=null,query='',filter='전체',zoom=1,cx=160,cy=166,alive=true,drag=null,suppress=false;
 const key=`stockwars.phone.map.target.${source.taskDomain||'normal'}.v1`;
 try{const saved=localStorage.getItem(key);if(MAP_PLACES.some(p=>p.id===saved))target=saved;}catch{}
 phone.detail.classList.add('cozy-phone__detail--map');host.classList.add('phone-map');
 function read(){return source.mapPosition?.()||null;}
 function setView(){const svg=host.querySelector('svg'),w=320/zoom,h=332/zoom;cx=Math.max(w/2,Math.min(320-w/2,cx));cy=Math.max(h/2,Math.min(332-h/2,cy));svg?.setAttribute('viewBox',`${cx-w/2} ${cy-h/2} ${w} ${h}`);}
 function updatePosition(){
  if(!alive)return;const pos=read(),marker=host.querySelector('[data-player-marker]');if(!marker)return;
  marker.toggleAttribute('hidden',!pos);
  if(pos){const point=project(pos.x,pos.y);marker.setAttribute('transform',`translate(${point.x} ${point.y})`);marker.dataset.worldX=pos.x;marker.dataset.worldY=pos.y;marker.querySelector('title').textContent=`내 위치 · ${pos.label}`;}
  host.querySelector('[data-location-status]').textContent=pos?pos.label:'위치 확인 중';
  const nearby=host.querySelector('[data-nearby]');
  if(nearby){const sorted=pos?[...MAP_PLACES].sort((a,b)=>Math.hypot(a.x-pos.x,a.y-pos.y)-Math.hypot(b.x-pos.x,b.y-pos.y)).slice(0,3):[];const ids=sorted.map(p=>p.id).join();if(nearby.dataset.order!==ids){nearby.dataset.order=ids;nearby.innerHTML=sorted.map(p=>`<button class="phone-map-row" data-place="${p.id}"><span>${p.meta[3]}</span><span><strong>${esc(p.name)}</strong><small>${p.meta[1]} · 위치 보기</small></span><b>›</b></button>`).join('')||'<p class="phone-map-note">위치를 확인하면 주변 시설이 표시돼요.</p>';}}
 }
 function render(){
  if(!alive)return;const b=MAP_PLACES.find(p=>p.id===selected);
  host.innerHTML=`${b?'<button class="phone-map-back" data-action="back">‹ 마을 지도</button><h3>장소 안내</h3>':`<div class="phone-map-heading"><h3>지도</h3><span>포포리 마을</span></div><p class="phone-map-sub">어디로 가볼까요?</p><label class="phone-map-search"><input data-map-search aria-label="시설 찾기" placeholder="시설 이름으로 찾기" value="${esc(query)}"></label><nav class="phone-map-filters">${['전체','생활','금융','상점'].map(f=>`<button data-filter="${f}" aria-pressed="${filter===f}">${f}</button>`).join('')}</nav>`}<div class="phone-map-box">${mapSVG({selected,target,query:b?'':query,filter:b?'전체':filter})}<div class="phone-map-controls"><button data-action="in" aria-label="지도 확대">＋</button><button data-action="out" aria-label="지도 축소">−</button></div></div><div class="phone-map-location"><span><i></i>내 위치 · <span data-location-status></span></span><button data-action="locate">⌖ 내 위치로</button></div>${b?`<article class="phone-map-card"><small>${b.meta[1]}</small><h4>${esc(b.name)}</h4><p>${b.meta[4]}</p><div>${b.meta[5]}</div><button data-action="target" aria-pressed="${target===selected}">${target===selected?'목적지 표시 해제':'목적지로 표시'}</button></article><p class="phone-map-note" role="status">${target?'지도에 목적지를 표시했어요.':''}</p>`:`${!MAP_PLACES.some(p=>(filter==='전체'||p.meta[1]===filter)&&p.name.includes(query.trim()))?'<p class="phone-map-note">검색 결과가 없어요.</p>':''}<h4 class="phone-map-near-heading">현재 위치 주변</h4><div data-nearby></div><p class="phone-map-note">시설 위치를 누르면 안내를 볼 수 있어요.</p>`}`;
  setView();updatePosition();
 }
 function action(e){
  if(suppress)return;const el=e.target.closest('[data-action],[data-filter],[data-place]');if(!el)return;
  if(el.dataset.place){selected=el.dataset.place;render();phone.detail.scrollTop=0;return;}
  if(el.dataset.filter){filter=el.dataset.filter;render();return;}
  const a=el.dataset.action;
  if(a==='back'){selected=null;render();phone.detail.scrollTop=0;}
  if(a==='in'||a==='out'){zoom=Math.max(1,Math.min(2.5,zoom+(a==='in'?.25:-.25)));setView();}
  if(a==='locate'){const pos=read();if(pos){const p=project(pos.x,pos.y);cx=p.x;cy=p.y;setView();}}
  if(a==='target'){target=target===selected?null:selected;try{if(target)localStorage.setItem(key,target);else localStorage.removeItem(key);}catch{}render();}
 }
 host.onclick=action;
 const capture=e=>{if(e.target.matches?.('[data-place]')&&['Enter',' '].includes(e.key)){action(e);return true;}return false;};
 phone.captureAppKey=capture;
 host.oninput=e=>{if(!e.target.matches('[data-map-search]'))return;const start=e.target.selectionStart;query=e.target.value;render();const input=host.querySelector('[data-map-search]');input.focus({preventScroll:true});input.setSelectionRange(start,start);};
 host.onpointerdown=e=>{if(e.button!==0||!e.target.closest('.phone-map-canvas'))return;const box=host.querySelector('.phone-map-canvas').getBoundingClientRect();drag={x:e.clientX,y:e.clientY,cx,cy,width:box.width,height:box.height};};
 host.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)suppress=true;if(suppress){if(!host.hasPointerCapture(e.pointerId))host.setPointerCapture(e.pointerId);cx=drag.cx-dx/drag.width*320/zoom;cy=drag.cy-dy/drag.height*332/zoom;setView();}};
 host.onpointerup=host.onpointercancel=e=>{drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);setTimeout(()=>{suppress=false;},0);};
 render();const timer=setInterval(updatePosition,250);
 return()=>{alive=false;clearInterval(timer);if(phone.captureAppKey===capture)phone.captureAppKey=null;host.onclick=host.oninput=host.onpointerdown=host.onpointermove=host.onpointerup=host.onpointercancel=null;host.classList.remove('phone-map');phone.detail.classList.remove('cozy-phone__detail--map');};
}
