import { paintCharacterSprite } from '../CharacterSprite.js';
import { StorePlayerController } from '../store/StorePlayerController.js';
import { gameKey, bindingLabel } from '../../app/GameKeys.js';
import { SALON_ROOM, SALON_FLOOR, SALON_OBJECTS, SALON_PLACES, inside, salonBehind, createSalonNavigation } from './SalonRoomGeometry.js';

// Use the approved full illustration, including Claire, without regenerating or compositing her.
const ART_URL = new URL('../../../assets/interiors/salon/salon-room-package-v9-owner.png', import.meta.url).href;
const VIEW = Object.freeze({ x:0, y:150, width:1216, height:1040 });
export class SalonInterior {
    constructor(container, callbacks = {}) {
        this.callbacks = callbacks;
        this.isOpen = false;
        this.navigation = createSalonNavigation();
        this.player = new StorePlayerController();
        this.player.configureRoom(this.navigation);
        this.direction = 'down';
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'salon-interior';
        this.dialog.setAttribute('aria-label', '살롱 드 테일 내부');
        this.dialog.innerHTML = `<header><strong>살롱 드 테일</strong><button type="button" data-debug aria-pressed="false">충돌 영역 확인</button><button type="button" data-exit>마을로 나가기 · Esc</button></header>
            <div class="salon-viewport"><canvas width="${SALON_ROOM.width}" height="${SALON_ROOM.height}" tabindex="0" aria-label="살롱 내부. WASD 이동, 바닥 클릭 이동, F 상호작용"></canvas></div>
            <div class="salon-actions">${SALON_PLACES.map(p=>`<button type="button" data-place="${p.id}">${p.label}</button>`).join('')}</div>
            <footer><span data-status role="status">WASD 이동 · 바닥 클릭 · ${bindingLabel('f')} 상호작용</span><button type="button" data-near hidden></button></footer>`;
        container.append(this.dialog);
        this.canvas = this.dialog.querySelector('canvas');
        this.viewport = this.dialog.querySelector('.salon-viewport');
        this.resizeObserver = new ResizeObserver(() => { this.resizeCanvas(); if(this.isOpen)this.draw(); });
        this.resizeObserver.observe(this.viewport);
        window.addEventListener('resize', () => { this.resizeCanvas(); if(this.isOpen)this.draw(); });
        this.status = this.dialog.querySelector('[data-status]');
        this.nearButton = this.dialog.querySelector('[data-near]');
        this.dialog.querySelector('[data-exit]').onclick = () => this.close();
        this.dialog.querySelector('[data-debug]').onclick = e => {
            this.debug = !this.debug;
            e.currentTarget.setAttribute('aria-pressed', String(this.debug));
            this.draw();
        };
        this.dialog.querySelectorAll('[data-place]').forEach(button=>button.onclick=()=>this.request(button.dataset.place));
        this.nearButton.onclick = () => this.seated ? this.standUp() : this.request(this.nearest()?.id);
        this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
        this.dialog.addEventListener('close', () => {
            this.isOpen = false;
            this.player.stop();
            this.pending = this.seated = null;
            cancelAnimationFrame(this.frame);
            this.callbacks.onClose?.();
        });
        this.dialog.addEventListener('keydown', e => {
            if(!this.active()||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
            const key=gameKey(e);
            e.stopPropagation();
            if(['w','a','s','d','shift'].includes(key)) {
                e.preventDefault();this.standUp();this.pending=null;this.player.keys.add(key);
            } else if(key==='f'&&!e.repeat) {
                e.preventDefault();this.seated?this.standUp():this.request(this.nearest()?.id);
            }
        });
        window.addEventListener('keyup', e=>this.player.keys.delete(gameKey(e)));
        window.addEventListener('blur', ()=>{this.player.stop();this.pending=null;});
        document.addEventListener('visibilitychange', ()=>{if(document.hidden){this.player.stop();this.pending=null;}});
        this.canvas.addEventListener('click', e=>{
            if(!this.active()||!this.background.naturalWidth)return;
            const p=this.eventPoint(e);if(!p)return;
            const place=SALON_PLACES.find(q=>inside(p.x,p.y,q.hit));
            if(place){this.request(place.id);return;}
            this.standUp();this.pending=null;
            if(this.navigation.isWalkable(p.x,p.y)){this.player.moveTo(p.x,p.y);if(!this.player.target)this.status.textContent='이곳으로 이동할 수 없습니다.';}
            this.canvas.focus();
        });
        this.background = new Image();
        this.background.onload = () => {if(this.isOpen)this.draw();};
        this.background.onerror = () => {this.status.textContent='룸 에셋을 불러오지 못했습니다. 다시 입장해 주세요.';};
        this.background.src = ART_URL;
    }
    active() { return this.isOpen && !document.hidden && this.dialog.matches(':modal') && !document.querySelector('dialog[open]:not(.salon-interior)'); }
    eventPoint(event) {
        const rect=this.canvas.getBoundingClientRect(),scale=Math.min(rect.width/VIEW.width,rect.height/VIEW.height);
        const x=VIEW.x+(event.clientX-rect.left-(rect.width-VIEW.width*scale)/2)/scale;
        const y=VIEW.y+(event.clientY-rect.top-(rect.height-VIEW.height*scale)/2)/scale;
        return x>=0&&y>=0&&x<=SALON_ROOM.width&&y<=SALON_ROOM.height?{x,y}:null;
    }
    nearest() {
        return SALON_PLACES.map(p=>({place:p,distance:Math.hypot(p.x-this.player.x,p.y-this.player.y)}))
            .filter(p=>p.distance<64).sort((a,b)=>a.distance-b.distance)[0]?.place;
    }
    request(id) {
        if(!this.active()||!this.background.naturalWidth)return;
        const place=SALON_PLACES.find(p=>p.id===id);if(!place)return;
        this.standUp();this.player.stop();this.pending=null;
        if(!this.navigation.route(this.player,place).length){this.status.textContent='이곳으로 이동할 수 없습니다.';return;}
        this.pending=place;this.player.moveTo(place.x,place.y);this.canvas.focus();
    }
    arrive(place) {
        this.player.stop();
        if(place.action==='exit'){this.close();return;}
        if(place.seat) {
            this.standPosition={x:this.player.x,y:this.player.y};this.seated=place;
            Object.assign(this.player,place.seat);this.direction=place.seat.direction;
            this.status.textContent='앉아 있습니다. 이동하거나 '+bindingLabel('f')+'로 일어나세요.';
        } else if(place.action==='styles') {
            this.status.textContent='클레어가 완성형 스타일을 준비하고 있어요.';
            this.callbacks.onStyles?.();
        } else if(place.action==='wash') this.status.textContent='샴푸석입니다. 그루밍 서비스는 준비 중입니다.';
    }
    standUp() {
        if(!this.seated)return;
        Object.assign(this.player,this.navigation.clamp(this.standPosition.x,this.standPosition.y));
        this.seated=null;this.status.textContent='WASD 이동 · 바닥 클릭 · '+bindingLabel('f')+' 상호작용';
    }
    path(ctx,polygon) {ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
    resizeCanvas() {
        const width=this.viewport.clientWidth,height=this.viewport.clientHeight;
        if(!width||!height)return;
        const fit=Math.min(width/VIEW.width,height/VIEW.height);
        this.canvas.style.width=VIEW.width*fit+'px';
        this.canvas.style.height=VIEW.height*fit+'px';
        const rect=this.canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
        if(!rect.width||!rect.height)return;
        const pixelWidth=Math.max(1,Math.round(rect.width*dpr)),pixelHeight=Math.max(1,Math.round(rect.height*dpr));
        if(this.canvas.width!==pixelWidth)this.canvas.width=pixelWidth;
        if(this.canvas.height!==pixelHeight)this.canvas.height=pixelHeight;
        this.pixelRatio=dpr;
    }
    draw() {
        if(this.pixelRatio!==(window.devicePixelRatio||1))this.resizeCanvas();
        const ctx=this.canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(!this.background.naturalWidth)return;
        const scale=Math.min(this.canvas.width/VIEW.width,this.canvas.height/VIEW.height);
        ctx.save();ctx.translate((this.canvas.width-VIEW.width*scale)/2,(this.canvas.height-VIEW.height*scale)/2);
        ctx.scale(scale,scale);ctx.translate(-VIEW.x,-VIEW.y);
        ctx.drawImage(this.background,0,0);
        ctx.save();ctx.translate(this.player.x,this.player.y);ctx.scale(SALON_ROOM.characterScale,SALON_ROOM.characterScale);
        paintCharacterSprite(ctx,0,0,{direction:this.direction,moving:this.player.moving,seated:!!this.seated});ctx.restore();
        // Reuse the same unified image only within foreground masks. The room art
        // is never stretched; actors and furniture share one source-pixel transform.
        for(const object of SALON_OBJECTS)if(salonBehind(this.player,object)) {
            ctx.save();this.path(ctx,object.silhouette);ctx.clip();ctx.drawImage(this.background,0,0);ctx.restore();
        }
        if(this.debug) {
            ctx.lineWidth=3;ctx.strokeStyle='#29d2dc';this.path(ctx,SALON_FLOOR);ctx.stroke();
            for(const body of this.navigation.bodies){ctx.fillStyle='#ef406644';ctx.strokeStyle='#ff4779';this.path(ctx,body.polygon);ctx.fill();ctx.stroke();}
            ctx.strokeStyle='#39df83';ctx.beginPath();ctx.ellipse(this.player.x,this.player.y,24,12,0,0,2*Math.PI);ctx.stroke();
            SALON_PLACES.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,8,0,2*Math.PI);ctx.fillStyle='#39df83';ctx.fill();});
        }
        ctx.restore();
    }
    animate(now) {
        if(!this.isOpen)return;
        if(this.active()) {
            const before={x:this.player.x,y:this.player.y};
            if(!this.seated)this.player.update((now-this.lastFrame)/1000);
            const dx=this.player.x-before.x,dy=this.player.y-before.y;
            if(this.player.moving)this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
            if(this.pending&&Math.hypot(this.player.x-this.pending.x,this.player.y-this.pending.y)<5) {
                const place=this.pending;this.pending=null;this.arrive(place);
            }
        } else {this.player.stop();this.pending=null;}
        this.lastFrame=now;
        const near=this.nearest();this.nearButton.hidden=!this.seated&&!near;
        this.nearButton.textContent=this.seated?'일어나기 · '+bindingLabel('f'):near?near.label+' · '+bindingLabel('f'):'';
        this.canvas.dataset.playerX=this.player.x.toFixed(2);this.canvas.dataset.playerY=this.player.y.toFixed(2);
        this.draw();if(this.isOpen)this.frame=requestAnimationFrame(t=>this.animate(t));
    }
    open() {
        if(this.isOpen)return;
        this.player.reset();this.pending=this.seated=null;this.direction='down';
        this.status.textContent='WASD 이동 · 바닥 클릭 · '+bindingLabel('f')+' 상호작용';
        this.dialog.showModal();this.isOpen=true;this.resizeCanvas();this.canvas.focus();this.lastFrame=performance.now();this.animate(this.lastFrame);
    }
    close() {
        if(!this.isOpen)return;
        this.isOpen=false;this.player.stop();this.pending=null;cancelAnimationFrame(this.frame);
        this.dialog.close();
    }
}
