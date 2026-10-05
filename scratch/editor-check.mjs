import {guideGrid} from './CipherGuidePreview.js';
import {cipherDrawOrder} from './CipherDepth.js';
import {CIPHER_FURNITURE_RASTERS,cipherRasterRect,paintCipherRaster} from './CipherFurnitureRaster.js';
import {drawMarketDisplay} from './CipherMarketDisplay.js';
import {carpetContains} from './CipherCarpet.js';

import { drawAgentK } from './CipherAgentK.js';
import { cipherGridToScreen, CIPHER_FLOOR } from './CipherGrid.js';
import { SPRITES } from './store/VivianInteriorScene.js';
const KEY='stockwars.cipher-room-layout.v1';
const catalog={table:['유리 테이블 · 2×2',2,2],sofa:['대기 소파 · 2×1',1,2],carpet:['출입 카펫 · 2×1',1,2],cornerDisplay:['코너 전광판 · 2×2',2,2],counter:['안내 데스크 · 2×3 (NPC 공간 포함)',2,3],plant:['화분',1,1],papers:['자료 매대 (임시)',2,1],goods:['선반 (임시)',1,2]};
const copy=items=>items.map(i=>({...i}));
export function cipherFurnitureSize(item){const [,w,h]=catalog[item.asset];return item.rotation===1?[h,w]:[w,h];}
function furniturePoint(item,p){if(item.rotation!==1)return p;const origin=cipherGridToScreen(item.u,item.v);return {x:2*origin.x-p.x,y:p.y};}
export function validCipherPlacement(item,items=[]){
    if(!catalog[item.asset]||![item.u,item.v].every(Number.isInteger))return false;
    if(item.rotation!==undefined&&item.rotation!==0&&item.rotation!==1)return false;
    if(item.asset==='cornerDisplay')return item.u===0&&item.v===0&&!items.some(i=>i.id!==item.id&&i.asset==='cornerDisplay');
    const [w,h]=cipherFurnitureSize(item);
    for(const [u,v] of [[item.u,item.v],[item.u+w,item.v],[item.u+w,item.v+h],[item.u,item.v+h]]){
        const {x,y}=cipherGridToScreen(u,v);
        if(u<0||v<0||u>10||v>10)return false;
    }
    // Keep the stair landing and the two rear door approaches clear.
    for(let u=item.u;u<item.u+w;u++)for(let v=item.v;v<item.v+h;v++){
        if((u>=2&&u<=5&&v<2)||(u<1&&v>=6)||(v<1&&u>=6))return false;
        for(const other of items){if(other.id===item.id||other.asset==='cornerDisplay')continue;const [ow,oh]=cipherFurnitureSize(other);if(u>=other.u&&u<other.u+ow&&v>=other.v&&v<other.v+oh)return false;}
    }
    return true;
}
export class CipherRoomEditor{
    constructor(lobby){
        this.lobby=lobby;this.active=false;this.selected=null;this.items=[];this.images={};
        this.agentK=new Image();
        this.agentK.onload=()=>{lobby.sceneLayers=null;lobby.draw();};
        this.agentK.src=new URL('../../assets/characters/agent-k/agent-k-chibi-isometric-v1.png',import.meta.url).href;
        let layoutVersion=0;
        try{const saved=JSON.parse(localStorage.getItem(KEY));layoutVersion=saved?.version||0;if([1,2,3,4].includes(saved?.version)&&Array.isArray(saved.items)&&saved.items.length<=64&&new Set(saved.items.map(i=>i.id)).size===saved.items.length){const clean=saved.items.filter(i=>typeof i.id==='string'&&catalog[i.asset]);if(clean.length===saved.items.length&&clean.every(i=>validCipherPlacement(i,clean)))this.items=clean;}}catch{}
        if(layoutVersion<4||!this.items.length)this.items=[
            ['cornerDisplay',0,0,0],['counter',0,1,0],['carpet',9,6,0],
            ['sofa',2,7,0],['sofa',4,5,1],['table',4,7,0],['plant',1,4,0],['plant',9,9,0]
        ].map(([asset,u,v,rotation])=>({id:crypto.randomUUID(),asset,u,v,rotation}));
        if(layoutVersion<4){try{localStorage.setItem(KEY,JSON.stringify({version:4,items:this.items}));}catch{}}
        this.committed=copy(this.items);
        const panel=document.createElement('div');panel.className='cipher-editor';panel.hidden=true;
        panel.innerHTML='<label>추가할 가구 <select class="cipher-catalog"></select></label><button data-action="add">가구 추가</button><label>선택 <select class="cipher-selection"></select></label><button data-move="-1,0">↖</button><button data-move="0,-1">↗</button><button data-move="0,1">↙</button><button data-move="1,0">↘</button><button data-action="rotate">회전 ↻</button><button data-action="copy">복제</button><button data-action="delete">삭제</button><button data-action="reset">모두 비우기</button><button data-action="cancel">취소</button><button data-action="save">배치 저장</button><p role="status" aria-live="polite"></p>';
        lobby.canvas.before(panel);this.panel=panel;this.status=panel.querySelector('[role=status]');
        for(const [id,[name]] of Object.entries(catalog)){const o=document.createElement('option');o.value=id;o.textContent=name;panel.querySelector('.cipher-catalog').append(o);const image=new Image();image.onload=()=>{lobby.sceneLayers=null;lobby.draw();};image.src=CIPHER_FURNITURE_RASTERS[id]?new URL('../../assets/interiors/cipher/'+CIPHER_FURNITURE_RASTERS[id].file,import.meta.url).href:id==='plant'?new URL('../../assets/interiors/cipher/cipher-plant-1x1-simple-v2.png',import.meta.url).href:id==='table'?new URL('../../assets/interiors/cipher/cipher-table-2x2-glass-v2.png',import.meta.url).href:id==='sofa'?new URL('../../assets/interiors/cipher/cipher-sofa-applied-v4.svg',import.meta.url).href:id==='carpet'?new URL('../../assets/interiors/cipher/cipher-entrance-carpet-user-v3.svg',import.meta.url).href:id==='counter'?new URL('../../assets/interiors/cipher/cipher-reception-desk-common-grid-v4.png',import.meta.url).href:id==='cornerDisplay'?new URL('../../assets/interiors/cipher/cipher-display-frame-corner-v2.png',import.meta.url).href:new URL((SPRITES[id].directory||'../../../assets/interiors/vivian-grid-v2/')+id+'.png',new URL('./store/VivianInteriorScene.js',import.meta.url)).href;this.images[id]=image;}
        panel.querySelector('.cipher-selection').onchange=e=>{this.selected=e.target.value;this.refresh();};
        panel.onclick=e=>{const action=e.target.dataset.action;if(action)this[action]();const move=e.target.dataset.move;if(move){const [du,dv]=move.split(',').map(Number),i=this.current();if(i)this.move(i.u+du,i.v+dv);}};
        lobby.canvas.addEventListener('pointerdown',e=>this.down(e));
        lobby.canvas.addEventListener('pointermove',e=>this.dragMove(e));
        lobby.canvas.addEventListener('pointerup',()=>this.endDrag());
        lobby.canvas.addEventListener('pointercancel',()=>this.endDrag(true));
        lobby.canvas.addEventListener('lostpointercapture',()=>this.endDrag(true));
        this.refresh();
    }
    current(){return this.items.find(i=>i.id===this.selected);}
    rotate(){this.endDrag();const i=this.current();if(!i)return;if(i.asset==='cornerDisplay'){this.status.textContent='코너 전광판은 벽 모서리에 고정되어 회전할 수 없습니다.';return;}const next={...i,rotation:i.rotation===1?0:1};if(!validCipherPlacement(next,this.items)){this.status.textContent='회전할 공간이 부족합니다. 빈 칸으로 이동한 뒤 회전해 주세요.';return;}Object.assign(i,next);this.refresh();}
    begin(){this.committed=copy(this.items);this.active=true;this.panel.hidden=false;this.lobby.canvas.classList.add('is-arranging');this.lobby.dialog.querySelector('.cipher-grid-toggle').setAttribute('aria-pressed',String(this.lobby.showGrid));this.refresh();}
    finish(){this.endDrag();this.active=false;this.panel.hidden=true;this.lobby.canvas.classList.remove('is-arranging');this.lobby.dialog.querySelector('.cipher-arrange').setAttribute('aria-expanded','false');this.lobby.draw();}
    cancel(){this.endDrag(true);this.items=copy(this.committed);this.finish();}
    save(){this.endDrag();try{localStorage.setItem(KEY,JSON.stringify({version:4,items:this.items}));this.committed=copy(this.items);this.finish();}catch{this.status.textContent='저장하지 못했습니다. 다시 시도해 주세요.';}}
    reset(){this.items=[];this.selected=null;this.refresh();}
    delete(){this.items=this.items.filter(i=>i.id!==this.selected);this.selected=this.items[0]?.id;this.refresh();}
    copy(){if(this.current())this.add(this.current().asset,this.current().rotation||0);}
    add(asset,rotation=0){if(typeof asset!=='string')asset=this.panel.querySelector('.cipher-catalog').value;if(this.items.length>=64)return;const i={id:crypto.randomUUID(),asset,u:0,v:0,rotation};if(asset==='cornerDisplay'){if(!validCipherPlacement(i,this.items)){this.status.textContent='코너 전광판은 코너에 하나만 설치할 수 있습니다.';return;}this.items.push(i);this.selected=i.id;this.refresh();return;}for(let u=1;u<10;u++)for(let v=1;v<10;v++){i.u=u;i.v=v;if(validCipherPlacement(i,this.items)){this.items.push(i);this.selected=i.id;this.refresh();return;}}this.status.textContent='배치할 빈 칸이 없습니다.';}
    move(u,v){const i=this.current();if(!i)return;if(i.asset==='cornerDisplay'){this.status.textContent='2×2 코너 전광판은 뒤쪽 벽 모서리에 고정됩니다.';return;}const next={...i,u,v};if(!validCipherPlacement(next,this.items)){this.status.textContent='바닥 안의 빈 칸에 놓아주세요. 문과 계단 앞은 비워 둡니다.';return;}Object.assign(i,next);this.refresh();}
    refresh(){const select=this.panel.querySelector('.cipher-selection');select.replaceChildren(...this.items.map(i=>{const o=document.createElement('option');o.value=i.id;o.textContent=catalog[i.asset][0];return o;}));if(!this.current())this.selected=this.items[0]?.id;select.value=this.selected||'';const i=this.current();this.status.textContent=i?`${catalog[i.asset][0]} · (${i.u+1}, ${i.v+1}) · ${i.rotation===1?"전환 방향":"기본 방향"} · 드래그하거나 방향 버튼으로 이동`:'가구를 추가해 배치하세요. 저장하면 다음에도 유지됩니다.';this.lobby.draw();}
    baseRect(i){if(CIPHER_FURNITURE_RASTERS[i.asset])return cipherRasterRect(i);const sprite=SPRITES[i.asset], [,w,h]=catalog[i.asset];const p=cipherGridToScreen(i.u+w/2,i.v+h/2),scale=68/85;return {x:p.x-sprite.size[0]*scale*sprite.anchor[0],y:p.y-sprite.size[1]*scale*sprite.anchor[1],w:sprite.size[0]*scale,h:sprite.size[1]*scale};}
    rect(i){const r=this.baseRect(i);if(i.rotation!==1)return r;const p=furniturePoint(i,{x:r.x+r.w,y:r.y});return {...r,x:p.x};}
    paint(ctx,ordered=null){
        const staffedDesk=this.items.find(item=>item.asset==='counter');
        for(const i of (ordered||cipherDrawOrder(this.items,this.lobby.player&&!this.active?this.lobby.playerItem():null,cipherFurnitureSize))){
            if(i.asset==='player'){this.lobby.paintPlayer(ctx);continue;}
            ctx.save();
            if(i.rotation===1){const p=cipherGridToScreen(i.u,i.v);ctx.translate(2*p.x,0);ctx.scale(-1,1);}
            if(CIPHER_FURNITURE_RASTERS[i.asset]){
                if(i===staffedDesk)drawAgentK(ctx,this.agentK,i);
                paintCipherRaster(ctx,this.images[i.asset],i);
                if(i.asset==='cornerDisplay'&&this.images.cornerDisplay?.naturalWidth){
                    const r=this.baseRect(i),spec=CIPHER_FURNITURE_RASTERS.cornerDisplay;
                    ctx.save();ctx.translate(r.x,r.y);ctx.scale(r.w/spec.size[0],r.h/spec.size[1]);drawMarketDisplay(ctx,true);ctx.restore();
                }
            }else{
                const image=this.images[i.asset],r=this.baseRect(i),sprite=SPRITES[i.asset];
                if(image?.complete&&image.naturalWidth){ctx.translate(r.x,r.y);ctx.scale(r.w/sprite.crop[2],r.h/sprite.crop[3]);ctx.translate(-sprite.crop[0],-sprite.crop[1]);if(sprite.matrix)ctx.transform(...sprite.matrix);ctx.drawImage(image,0,0);}
            }
            ctx.restore();this.paintSelection(ctx,i);
        }
    }
    paintSelection(ctx,i){if(!this.active||i.id!==this.selected)return;const [w,h]=cipherFurnitureSize(i);ctx.beginPath();[[i.u,i.v],[i.u+w,i.v],[i.u+w,i.v+h],[i.u,i.v+h]].forEach(([u,v],n)=>{const p=cipherGridToScreen(u,v);n?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.closePath();ctx.strokeStyle="#58e6ff";ctx.lineWidth=3;ctx.stroke();}
    point(e){const c=this.lobby.canvas,r=c.getBoundingClientRect(),scale=Math.min(r.width/c.width,r.height/c.height);const p={x:(e.clientX-r.left-(r.width-c.width*scale)/2)/scale,y:(e.clientY-r.top-(r.height-c.height*scale)/2)/scale};if(this.active){const g=guideGrid(p.x,p.y);return cipherGridToScreen(g.u,g.v);}return p;}
    nearest(p){let best={u:0,v:0,d:Infinity};for(let u=0;u<=10;u++)for(let v=0;v<=10;v++){const q=cipherGridToScreen(u,v),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<best.d)best={u,v,d};}return best;}
    down(e){if(e.button!==0)return;if(!this.active){this.lobby.movePlayerTo(this.point(e));return;}const p=this.point(e);const i=[...this.items].sort((a,b)=>b.u+b.v-a.u-a.v).find(i=>{const g=guideGrid(p.x,p.y),[w,h]=cipherFurnitureSize(i);return g.u>=i.u&&g.u<=i.u+w&&g.v>=i.v&&g.v<=i.v+h;});if(!i)return;e.preventDefault();this.selected=i.id;this.drag={pointer:e.pointerId,start:this.nearest(p),original:{...i}};this.lobby.canvas.setPointerCapture(e.pointerId);this.refresh();}
    dragMove(e){if(!this.drag||e.pointerId!==this.drag.pointer)return;const p=this.nearest(this.point(e)),d=this.drag;this.move(d.original.u+p.u-d.start.u,d.original.v+p.v-d.start.v);}
    endDrag(cancel=false){if(!this.drag)return;const d=this.drag;this.drag=null;if(cancel){const i=this.items.find(i=>i.id===d.original.id);if(i)Object.assign(i,d.original);}if(this.lobby.canvas.hasPointerCapture(d.pointer))this.lobby.canvas.releasePointerCapture(d.pointer);this.lobby.draw();}
}

























