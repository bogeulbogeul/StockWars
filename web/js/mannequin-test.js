/* 독립 테스트 화면: 게임 진행 상태와 저장 데이터는 사용하지 않는다. */
const stage = document.querySelector('#stage');
const player = document.querySelector('#player');
const status = document.querySelector('#status');
const fps = document.querySelector('#fps');
const speed = document.querySelector('#speed');
const sizeInput = document.querySelector('#size');
const loop = document.querySelector('#loop');
const row = { down: 0, left: 1, right: 2, up: 3 };
const keys = { ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up' };
const held = new Map();
let x = 0, y = 0, size = 128, direction = 'down', phase = 0, last = 0, ready = false;
function clamp() {
  x = Math.max(0, Math.min(x, stage.clientWidth - size));
  y = Math.max(0, Math.min(y, stage.clientHeight - size));
}
function center() { x=(stage.clientWidth-size)/2; y=(stage.clientHeight-size)/2; phase=0; clamp(); }
function clearInput() { held.clear(); last=0; }
function draw(frame) {
  player.style.width = player.style.height = size+'px';
  player.style.backgroundSize = `${size*4}px ${size*4}px`;
  player.style.backgroundPosition = `${-frame*size}px ${-row[direction]*size}px`;
  player.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}
function press(token, dir) {
  if(!held.has(token)) held.set(token,dir);
  if(direction!==dir) { direction=dir; phase=0; }
}
stage.addEventListener('keydown', e => { if(keys[e.code]) { e.preventDefault(); press(e.code,keys[e.code]); } });
window.addEventListener('keyup', e => held.delete(e.code));
stage.addEventListener('blur', clearInput);
stage.addEventListener('pointerdown', () => stage.focus());
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => { if(document.hidden) clearInput(); });
document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('pointerdown', e => { e.preventDefault(); stage.focus(); button.setPointerCapture(e.pointerId); press('pointer'+e.pointerId,button.dataset.direction); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => button.addEventListener(name,e => held.delete('pointer'+e.pointerId)));
});
fps.oninput = () => document.querySelector('#fps-value').textContent = fps.value+' fps';
speed.oninput = () => document.querySelector('#speed-value').textContent = speed.value+' px/s';
sizeInput.onchange = () => { size=Number(sizeInput.value); clamp(); };
document.querySelector('#reset').onclick = () => { clearInput(); center(); stage.focus(); };
new ResizeObserver(clamp).observe(stage);
const sheet = new Image();
sheet.onload = () => { ready=true; center(); stage.focus(); };
sheet.onerror = () => { status.textContent='시트 이미지를 불러오지 못했습니다. 경로를 확인해 주세요.'; };
sheet.src='assets/characters/mannequin/walk-4direction-v1.png';
function tick(now) {
  const dt=last ? Math.min((now-last)/1000,.05) : 0; last=now;
  if(ready) {
    const active=[...held.values()].at(-1);
    if(active && active!==direction) { direction=active; phase=0; }
    if(active) {
      const distance=Number(speed.value)*dt;
      x+=direction==='right'?distance:direction==='left'?-distance:0;
      y+=direction==='down'?distance:direction==='up'?-distance:0;
      clamp();
    }
    const walking=Boolean(active)||loop.checked;
    phase=walking?(phase+dt*Number(fps.value))%4:0;
    const frame=Math.floor(phase); draw(frame);
    status.textContent=`${{down:'앞',left:'왼쪽',right:'오른쪽',up:'뒤'}[direction]} · ${walking?'걷기':'정지 대용'} · 프레임 ${frame+1}/4`;
  }
  requestAnimationFrame(tick);
}
center(); requestAnimationFrame(tick);
