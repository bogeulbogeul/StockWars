import { gameKey, bindingLabel } from '../../app/GameKeys.js';
// Source artwork coordinates; every layer shares this uniform SVG transform.
export const HOME_ROOM = { id: 'home-office-basic-v1', width: 1254, height: 1254, x: 186.5, y: 58, scale: .5 };
export const HOME_ROOM_URL = new URL('../../../assets/office/home-office-package-v1.png', import.meta.url).href;
export const HOME_FLOOR = [[627,475],[1173,808],[617,1135],[104,780]];
export const HOME_OBJECTS = [
    {id:'wardrobe', footprint:[[335,640],[483,560],[548,599],[405,678]], shape:[[335,330],[483,242],[548,280],[548,599],[405,678],[335,640]]},
    {id:'desk', footprint:[[574,560],[750,455],[914,554],[914,670],[784,720],[574,602]], shape:[[570,450],[703,355],[817,424],[883,465],[914,554],[914,670],[784,720],[574,602]]},
    {id:'chair', footprint:[[595,626],[666,594],[740,644],[670,685]], shape:[[592,526],[637,483],[704,512],[740,577],[740,644],[670,685],[595,626]]},
    {id:'plant', footprint:[[1030,792],[1068,777],[1112,795],[1095,826],[1050,826]], shape:[[1006,694],[1029,653],[1078,649],[1137,676],[1134,723],[1112,795],[1095,826],[1050,826],[1030,792]]}
];
// Static rigid bodies use floor footprints, not the furniture's elevated silhouette.
export const HOME_RIGIDBODIES = HOME_OBJECTS.map(object => ({ id:object.id, type:'static', polygon:object.footprint }));
// Match the player's 22×11 SVG ground shadow at the room's 0.5 scale, plus clearance.
export const HOME_PLAYER_BODY = Object.freeze({ type:'kinematic', radiusX:64, radiusY:34 });
// Occlusion follows the front edge at the player's horizontal position.
export function homeFurnitureInFront(object,foot){
    const xs=object.footprint.map(p=>p[0]),min=Math.min(...xs),max=Math.max(...xs);
    if(foot.x<min-40||foot.x>max+40)return false;
    const x=Math.max(min+.001,Math.min(max-.001,foot.x)),ys=[];
    for(let i=0;i<object.footprint.length;i++){const a=object.footprint[i],b=object.footprint[(i+1)%object.footprint.length];if(a[0]!==b[0]&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0]))ys.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
    return foot.y<Math.max(...ys);
}
export const HOME_PLACES = [
    {id:'exit', label:'마을로 나가기', x:250,y:810, proximity:2, shape:[[149,475],[283,397],[283,699],[149,774]], action:'onOpenServerSelect'},
    {id:'wardrobe', label:'옷장 열기', x:470,y:880, shape:HOME_OBJECTS[0].shape, action:'onOpenWardrobe'},
    {id:'computer', label:'컴퓨터 · 주식 거래', x:750,y:760, shape:HOME_OBJECTS[1].shape, action:'onOpenComputer'}
];
export function homeGridToSource(x,y) { return {x:627+(y+.5)*68.25-(x+.5)*65.375,y:475+(x+.5)*38.125+(y+.5)*41.625}; }
export function homeSourceToGrid(x,y) {const dx=x-627,dy=y-475,d=65.375*41.625+68.25*38.125;return {gx:(68.25*dy-41.625*dx)/d-.5,gy:(38.125*dx+65.375*dy)/d-.5};}
export function homeGridToScreen(x,y) {const p=homeGridToSource(x,y);return {x:HOME_ROOM.x+p.x*.5,y:HOME_ROOM.y+p.y*.5};}
function inside(x,y,p){let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
function edge(x,y,p){const {radiusX:rx,radiusY:ry}=HOME_PLAYER_BODY;return p.some((a,i)=>{const b=p[(i+1)%p.length],ax=(a[0]-x)/rx,ay=(a[1]-y)/ry,dx=(b[0]-a[0])/rx,dy=(b[1]-a[1])/ry,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return Math.hypot(ax+t*dx,ay+t*dy)<=1;});}
export function homeWalkable(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return false;const p=homeGridToSource(x,y);return inside(p.x,p.y,HOME_FLOOR)&&!edge(p.x,p.y,HOME_FLOOR)&&!HOME_RIGIDBODIES.some(body=>inside(p.x,p.y,body.polygon)||edge(p.x,p.y,body.polygon));}
export function homeSafePosition(position){
    if(homeWalkable(position.gx,position.gy))return position;
    let nearest=null,distance=Infinity;
    for(let x=0;x<32;x++)for(let y=0;y<32;y++){const gx=x/4,gy=y/4,d=Math.hypot(gx-position.gx,gy-position.gy);if(homeWalkable(gx,gy)&&d<distance){nearest={gx,gy};distance=d;}}
    return nearest || {gx:3.5,gy:3.5};
}
// Sweep in short steps, stopping before contact. Manual movement can slide along a body.
export function homeMove(start,dx,dy,{slide=true}={}){
    let position=homeSafePosition(start);const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.04));
    for(let i=0;i<count;i++){const next={gx:position.gx+dx/count,gy:position.gy+dy/count};
        if(homeWalkable(next.gx,next.gy)){position=next;continue;}
        if(!slide)break;
        const alongX={gx:position.gx+dx/count,gy:position.gy};if(homeWalkable(alongX.gx,alongX.gy))position=alongX;
        const alongY={gx:position.gx,gy:position.gy+dy/count};if(homeWalkable(alongY.gx,alongY.gy))position=alongY;
    }
    return position;
}
export function homeSegment(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.gx-a.gx,b.gy-a.gy)/.04));for(let i=0;i<=n;i++)if(!homeWalkable(a.gx+(b.gx-a.gx)*i/n,a.gy+(b.gy-a.gy)*i/n))return false;return true;}
export function homeRoute(start,end){
    if(!homeWalkable(start.gx,start.gy)||!homeWalkable(end.gx,end.gy))return [];
    if(homeSegment(start,end))return [end];
    const nodes=[];const map=new Map();
    for(let x=0;x<32;x++)for(let y=0;y<32;y++)if(homeWalkable(x/4,y/4)){const n={gx:x/4,gy:y/4,x,y};nodes.push(n);map.set(`${x},${y}`,n);}
    const closest=p=>nodes.filter(n=>homeSegment(p,n)).sort((a,b)=>Math.hypot(a.gx-p.gx,a.gy-p.gy)-Math.hypot(b.gx-p.gx,b.gy-p.gy))[0];
    const first=closest(start),last=closest(end);if(!first||!last)return [];
    const queue=[first],prev=new Map([[first,null]]);
    for(let i=0;i<queue.length;i++){const n=queue[i];if(n===last){const path=[end];for(let q=n;q;q=prev.get(q))path.unshift({gx:q.gx,gy:q.gy});return path;}
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const next=map.get(`${n.x+dx},${n.y+dy}`);if(next&&!prev.has(next)&&homeSegment(n,next)){prev.set(next,n);queue.push(next);}}}
    return [];
}
const points=p=>p.map(a=>a.join(',')).join(' ');
export function homeRoomMarkup(){return `<g transform="translate(${HOME_ROOM.x} ${HOME_ROOM.y}) scale(.5)">
    <image class="office-room-art" href="${HOME_ROOM_URL}" width="1254" height="1254" pointer-events="none"/>
    <polygon id="homeWalkSurface" points="${points(HOME_FLOOR)}" fill="transparent" pointer-events="all"/>
    ${HOME_PLACES.map(p=>`<polygon data-home-place="${p.id}" role="button" tabindex="0" aria-label="${p.label}" points="${points(p.shape)}" fill="transparent" pointer-events="all" cursor="pointer"><title>${p.label}</title></polygon>`).join('')}
    </g>`;}
export class OfficeRoomPackage {
    constructor(stage){this.stage=stage;this.path=[];this.pending=null;this.rigidbodies=HOME_RIGIDBODIES;this.playerBody=HOME_PLAYER_BODY;
        const spawn=homeSafePosition({gx:stage.posX,gy:stage.posY});stage.posX=spawn.gx;stage.posY=spawn.gy;
        stage.svgStage.querySelectorAll('[data-home-place]').forEach(el=>{const act=e=>{e.stopPropagation();this.request(el.dataset.homePlace);};el.addEventListener('click',act);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(e);}});});
        stage.svgStage.querySelector('#homeWalkSurface').addEventListener('click',e=>{const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(stage.svgStage.getScreenCTM().inverse());this.move(homeSourceToGrid((pt.x-HOME_ROOM.x)/.5,(pt.y-HOME_ROOM.y)/.5));});
        const ns='http://www.w3.org/2000/svg';this.foreground=document.createElementNS(ns,'g');this.foreground.setAttribute('pointer-events','none');this.foreground.innerHTML=`<defs><clipPath id="homeForegroundClip"><path/></clipPath></defs><g transform="translate(${HOME_ROOM.x} ${HOME_ROOM.y}) scale(.5)"><image href="${HOME_ROOM_URL}" width="1254" height="1254" clip-path="url(#homeForegroundClip)"/></g>`;stage.svgStage.append(this.foreground);
        this.prompt=document.createElementNS(ns,'g');this.prompt.setAttribute('pointer-events','none');stage.svgStage.append(this.prompt);
        window.addEventListener('keydown',e=>{if(!this.active()||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const key=gameKey(e);if(['w','a','s','d'].includes(key)){e.preventDefault();this.cancel();stage.keysHeld.add(key);}if(key==='f'&&!e.repeat){const near=this.nearest();if(near){e.preventDefault();this.request(near.id);}}});
        window.addEventListener('keyup',e=>stage.keysHeld.delete(gameKey(e)));window.addEventListener('blur',()=>{stage.keysHeld.clear();this.cancel();});
    }
    active(){return !this.stage.stageContainer.classList.contains('hidden')&&!document.body.classList.contains('phone-view-active')&&!document.body.classList.contains('modal-active')&&!document.querySelector('dialog[open], .modal-overlay:not(.hidden)');}
    cancel(){this.path=[];this.pending=null;this.stage.targetTile=null;}
    nearest(){return HOME_PLACES.map(p=>{const g=homeSourceToGrid(p.x,p.y);return {place:p,distance:Math.hypot(g.gx-this.stage.posX,g.gy-this.stage.posY)};}).filter(p=>p.distance<(p.place.proximity??.8)).sort((a,b)=>a.distance-b.distance)[0]?.place;}
    move(end,place=null){this.cancel();if(!this.active())return;this.path=homeRoute({gx:this.stage.posX,gy:this.stage.posY},end);if(!this.path.length){this.stage.callbacks.onRoomMessage?.('이곳으로 이동할 수 없습니다.');return;}this.pending=place;}
    request(id){const p=HOME_PLACES.find(p=>p.id===id);if(p)this.move(homeSourceToGrid(p.x,p.y),p);}
    update(dt){const s=this.stage;if(!this.active()){s.keysHeld.clear();this.cancel();s.isMoving=false;return;}
        const safe=homeSafePosition({gx:s.posX,gy:s.posY});if(safe.gx!==s.posX||safe.gy!==s.posY){this.cancel();s.posX=safe.gx;s.posY=safe.gy;}
        let dx=0,dy=0;if(s.keysHeld.has('a'))dx--;if(s.keysHeld.has('d'))dx++;if(s.keysHeld.has('w'))dy--;if(s.keysHeld.has('s'))dy++;
        let gx=dy-dx,gy=dy+dx;const target=this.path[0];if(!gx&&!gy&&target){gx=target.gx-s.posX;gy=target.gy-s.posY;}
        const len=Math.hypot(gx,gy),dist=Math.min(len,4.8*dt),next=homeMove({gx:s.posX,gy:s.posY},len?gx/len*dist:0,len?gy/len*dist:0,{slide:!target});
        s.isMoving=Math.hypot(next.gx-s.posX,next.gy-s.posY)>1e-6;if(s.isMoving){s.posX=next.gx;s.posY=next.gy;s.dogDirection=Math.abs(gy-gx)>Math.abs(gx+gy)?(gy-gx<0?'left':'right'):(gx+gy<0?'up':'down');s.walkPhase+=dt*16;}else if(len>.01)this.cancel();
        if(target&&Math.hypot(target.gx-s.posX,target.gy-s.posY)<.01)this.path.shift();
        if(this.pending&&!this.path.length){const p=this.pending;this.pending=null;const end=homeSourceToGrid(p.x,p.y);if(Math.hypot(end.gx-s.posX,end.gy-s.posY)<.1)s.callbacks[p.action]?.();}
        s.renderCharacterFrame();const foot=homeGridToSource(s.posX,s.posY);
        this.foreground.querySelector('path').setAttribute('d',HOME_OBJECTS.filter(o=>homeFurnitureInFront(o,foot)).map(o=>`M${o.shape.map(p=>p.join(',')).join(' L')} Z`).join(' '));
        const near=this.nearest();this.prompt.innerHTML=near?`<rect x="-66" y="-16" width="132" height="26" rx="10" fill="#102b39" stroke="#00e5ff"/><text text-anchor="middle" y="1" fill="white" font-size="10">${near.label} · ${bindingLabel('f')}</text>`:'';this.prompt.setAttribute('transform',`translate(${HOME_ROOM.x+foot.x*.5} ${HOME_ROOM.y+foot.y*.5-120})`);
    }
}
