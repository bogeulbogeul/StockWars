import { SALON_STYLES } from './SalonStyleCatalog.js';
import { playSalonMakeoverEffect } from './SalonMakeoverEffect.js';

const directions=['down','right','up','left'];
const directionNames=['정면','오른쪽','뒤','왼쪽'];
const priceLabel=style=>`${style.price.toLocaleString('ko-KR')} G`;
const atlas=id=>new URL(`../../../assets/characters/forest-friends/${id}/atlas.png`,import.meta.url).href;
function sprite(style,rect,flip=false) {
    return `<svg viewBox="0 0 320 400" role="img" aria-label="${style.label}"><g ${flip?'transform="translate(320 0) scale(-1 1)"':''}><svg width="320" height="400" viewBox="${rect.x} ${rect.y} ${rect.w} ${rect.h}" overflow="hidden"><image href="${atlas(style.id)}" width="${style.frames.sheetWidth}" height="${style.frames.sheetHeight}"/></svg></g></svg>`;
}
export class SalonStyleShop {
    constructor(parent) {
        this.selected=SALON_STYLES[0];this.direction=0;this.motion='idle';
        this.dialog=document.createElement('dialog');this.dialog.className='salon-style-shop';
        this.dialog.setAttribute('aria-label','살롱 드 테일 스타일 상점');
        const building=new URL('../../../assets/buildings/topdown-v1/SalonDeTail-single-story-v3.png',import.meta.url).href;
        this.dialog.innerHTML=`<header class="salon-shop-header"><div class="salon-shop-brand"><svg viewBox="480 435 260 220" aria-hidden="true"><image href="${building}" width="1215" height="1295"/></svg><div><small>살롱 드 테일</small><h2>스타일 구매</h2></div></div><button type="button" data-close aria-label="스타일 상점 닫기">✕</button></header>
        <div class="salon-shop-body"><section class="salon-shop-catalog" aria-label="판매 테마"><div class="salon-theme-heading"><h3>숲속 친구들</h3><span>동물 스타일 6종</span></div><p class="salon-sale-note">판매 일정 · 준비 중</p><div class="salon-style-grid">${SALON_STYLES.map(s=>`<button type="button" class="salon-style-card" data-style="${s.id}" aria-pressed="false">${sprite(s,s.frames.rows.down_idle[0])}<strong>${s.label}</strong><span>${priceLabel(s)}</span></button>`).join('')}</div></section>
        <section class="salon-shop-detail" aria-label="선택한 스타일 미리보기"><h3 data-name></h3><p class="salon-theme-tag">숲속 친구들</p><div class="salon-fitting"><button type="button" data-turn="-1" aria-label="이전 방향">‹</button><div class="salon-mirror"><div data-preview></div></div><button type="button" data-turn="1" aria-label="다음 방향">›</button></div><p class="salon-direction" data-direction></p><div class="salon-motion-controls" role="group" aria-label="미리보기 동작">${[['idle','정지'],['walk','걷기'],['sit','앉기'],['carry','운반']].map(([id,label])=>`<button type="button" data-motion="${id}" aria-pressed="false">${label}</button>`).join('')}</div><p class="salon-preview-note" data-preview-note></p><div class="salon-purchase"><strong>${priceLabel(this.selected)}</strong><button type="button" disabled>판매 준비 중</button></div><p class="salon-shop-status" role="status">판매 일정이 정해지면 구매할 수 있어요.</p><small class="salon-style-explanation">동물 캐릭터 전체 외형이 변경됩니다.</small></section></div>`;
        parent.append(this.dialog);
        this.preview=this.dialog.querySelector('[data-preview]');
        const effectPreview=document.createElement('button');effectPreview.type='button';
        effectPreview.className='salon-effect-preview';effectPreview.textContent='변신 연출 미리보기';
        this.dialog.querySelector('.salon-style-explanation').after(effectPreview);
        effectPreview.onclick=async()=>{effectPreview.disabled=true;await playSalonMakeoverEffect(this.dialog,{preview:true});effectPreview.disabled=false;if(this.dialog.open)effectPreview.focus();};
        this.dialog.querySelector('[data-close]').onclick=()=>this.close();
        this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();});
        this.dialog.addEventListener('close',()=>{cancelAnimationFrame(this.frame);this.returnFocus?.focus();});
        this.dialog.addEventListener('keydown',e=>e.stopPropagation());
        this.dialog.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{this.selected=SALON_STYLES.find(s=>s.id===b.dataset.style);this.update();});
        this.dialog.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>{this.direction=(this.direction+Number(b.dataset.turn)+4)%4;this.update();});
        this.dialog.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>{this.motion=b.dataset.motion;this.update();});
    }
    update() {
        this.dialog.querySelector('[data-name]').textContent=this.selected.label;
        this.dialog.querySelector('.salon-purchase strong').textContent=priceLabel(this.selected);
        this.dialog.querySelectorAll('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style===this.selected.id)));
        this.dialog.querySelectorAll('[data-motion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.motion===this.motion)));
        const fixed=this.motion==='carry'||(this.motion==='sit'&&this.direction===2);
        this.dialog.querySelector('[data-direction]').textContent=this.motion==='carry'?'오른쪽':this.motion==='sit'&&this.direction===2?'정면':directionNames[this.direction];
        this.dialog.querySelector('[data-preview-note]').textContent=fixed?'준비된 방향의 모션을 표시합니다.':'';
        this.lastKey='';this.paint(performance.now());
    }
    paint(now) {
        const facing=directions[this.direction],basis=this.motion==='carry'?'right':this.motion==='sit'&&facing==='up'?'down':facing==='left'?'right':facing;
        const rows=this.selected.frames.rows;
        const frames=this.motion==='idle'?[rows[`${basis}_walk`][1]]:rows[`${basis}_${this.motion}`];
        const order=frames.length===3?[0,1,2,1]:frames.map((_,i)=>i);
        const index=['walk','carry'].includes(this.motion)?order[Math.floor(now/160)%order.length]:0;
        const flip=facing==='left'&&this.motion!=='carry';
        const key=`${this.selected.id}:${basis}:${this.motion}:${index}:${flip}`;
        if(key!==this.lastKey){this.preview.innerHTML=sprite(this.selected,frames[index],flip);this.lastKey=key;}
    }
    animate(now) {if(!this.dialog.open)return;this.paint(now);this.frame=requestAnimationFrame(t=>this.animate(t));}
    open() {if(this.dialog.open)return;this.returnFocus=document.activeElement;this.direction=0;this.motion='idle';this.update();this.dialog.showModal();this.dialog.querySelector('[data-close]').focus();this.animate(performance.now());}
    close() {cancelAnimationFrame(this.frame);this.dialog.close();}
}
