import { EMPTY_CHARACTER_IMAGE } from '../../data/characterAsset.js';
import {getVivianClockHandsHtml} from './VivianClock.js';

export const VIVIAN_PACKAGE_URL=new URL('../../../assets/interiors/vivian-package/vivian-room-with-squirrel-v8.png',import.meta.url).href;
export const VIVIAN_SQUIRREL_URL=EMPTY_CHARACTER_IMAGE;
// Measured source-art coordinates. 8 cells across the floor's 1336px diagonal.
export const VIVIAN_PACKAGE_VIEW_SCALE=1336/(8*67.5);
export const PACKAGE_FLOOR=[[768,247],[1420,618],[774,975],[114,619]];
export const PACKAGE_PLACES=[{id:'exit',x:1030,y:810,action:'exit',label:'나가기'},{id:'counter',x:450,y:690,action:'shop',tab:'daily',label:'비비안 · 상품 구매'},
    {id:'goods',x:570,y:560,action:'shop',tab:'daily',label:'일일 보급 진열대'},
    {id:'fridge',x:955,y:510,action:'shop',tab:'daily',label:'음료 냉장고'},
    {id:'household',x:1260,y:690,action:'shop',tab:'weekly',label:'주간 특수 상품'},
    {id:'island',x:795,y:770,action:'shop',tab:'daily',label:'중앙 상품 진열대'},
    {id:'wallShelf',x:1260,y:690,action:'shop',tab:'weekly',label:'벽 선반 · 특수 장비'}];
export const PACKAGE_OBJECTS=[
    // The rear rim and the whole worktop are foreground too, not only the fascia.
    {id:'counter',footprint:[[211,582],[420,481],[486,511],[486,585],[273,699],[211,667]],shape:[[207,564],[416,457],[487,484],[487,587],[272,699],[207,667]]},
    {id:'goods',footprint:[[406,455],[674,324],[706,383],[429,516]],shape:[[404,326],[660,192],[695,215],[707,383],[429,516],[405,494]]},
    {id:'fridge',footprint:[[808,340],[950,280],[1042,436],[950,471],[808,405]],shape:[[808,175],[875,138],[1042,226],[1042,436],[950,471],[808,405]]},
    {id:'plant',footprint:[[718,332],[779,313],[793,339],[752,359]],shape:[[707,277],[752,242],[796,271],[793,339],[752,359],[719,341]]},
    {id:'household',footprint:[[1058,532],[1137,491],[1385,599],[1318,655]],shape:[[1058,491],[1083,396],[1120,380],[1385,518],[1385,616],[1318,655],[1058,532]]},
    {id:'island',footprint:[[648,613],[716,576],[946,647],[867,710]],shape:[[648,594],[662,524],[737,465],[936,571],[946,647],[867,710],[648,613]]},
    {id:'baskets',footprint:[[1073,690],[1121,669],[1165,696],[1114,722]],shape:[[1072,630],[1129,596],[1165,626],[1165,696],[1114,722],[1073,690]]}
];
function splitAtX(polygon,x,left){
    const result=[];
    for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=left?a[0]<=x:a[0]>=x,insideB=left?b[0]<=x:b[0]>=x;
        if(insideA)result.push(a);if(insideA!==insideB)result.push([x,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])]);}
    return result;
}
export const PACKAGE_RIGIDBODIES=PACKAGE_OBJECTS.flatMap(o=>o.id==='fridge'?
    ['left','right'].map(side=>({id:`fridge-${side}`,type:'static',polygon:splitAtX(o.footprint,925,side==='left')})):
    [{id:o.id,type:'static',polygon:o.footprint}]);
// The cashier's occupied staff recess is also unavailable to visiting players.
PACKAGE_RIGIDBODIES.push({id:'staff-space',type:'static',polygon:[[205,561],[416,454],[397,398],[192,508]]});
// Mounted fixtures do not block the walking plane below them.
export const PACKAGE_WALL_FIXTURES=[
    {id:'wallShelf',type:'static',layer:'wall',shape:[[1152,336],[1223,300],[1340,369],[1337,409],[1280,437],[1152,377]]},
    {id:'clock',type:'static',layer:'wall',shape:[[218,348],[263,330],[286,349],[285,391],[243,413],[218,393]]}
];
export function inPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function nearEdge(x,y,p,rx=22,ry=10){return p.some((a,i)=>{const b=p[(i+1)%p.length],ax=(a[0]-x)/rx,ay=(a[1]-y)/ry,dx=(b[0]-a[0])/rx,dy=(b[1]-a[1])/ry,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return Math.hypot(ax+t*dx,ay+t*dy)<1;});}
function frontY(x,p){const ys=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(a[0]!==b[0]&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0]))ys.push(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));}return Math.max(...ys);}
export function createVivianPackageNavigation(){
    const walk=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&inPolygon(x,y,PACKAGE_FLOOR)&&!nearEdge(x,y,PACKAGE_FLOOR)&&!PACKAGE_RIGIDBODIES.some(o=>inPolygon(x,y,o.polygon)||nearEdge(x,y,o.polygon));
    const segment=(a,b)=>{const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let i=0;i<=steps;i++)if(!walk(a.x+(b.x-a.x)*i/(steps||1),a.y+(b.y-a.y)*i/(steps||1)))return false;return true;};
    const nodes=[],map=new Map(),step=8;
    for(let y=280;y<976;y+=step)for(let x=128;x<1424;x+=step)if(walk(x,y)){const p={x,y,index:nodes.length};nodes.push(p);map.set(`${x},${y}`,p);}
    const nearest=(p)=>nodes.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
    return {bodies:PACKAGE_RIGIDBODIES,places:PACKAGE_PLACES,isWalkable:walk,segment,clamp(x,y){return walk(x,y)?{x,y}:nearest({x,y});},route(start,end){
        if(!walk(start.x,start.y)||!walk(end.x,end.y))return [];
        if(segment(start,end))return [end];
        const attach=p=>nodes.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<40&&segment(p,n));
        const queue=attach(start),parents=new Map(queue.map(n=>[n.index,null])),ends=new Set(attach(end).map(n=>n.index));
        for(let i=0;i<queue.length;i++){const p=queue[i];if(ends.has(p.index)){const route=[end];for(let q=p;q;q=parents.get(q.index))route.unshift({x:q.x,y:q.y});return route;}
            for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8],[8,8],[-8,8],[8,-8],[-8,-8]]){const n=map.get(`${p.x+dx},${p.y+dy}`);if(n&&!parents.has(n.index)&&segment(p,n)){parents.set(n.index,p);queue.push(n);}}}
        return [];
    }};
}
const clip=p=>p.map(([x,y])=>`${x/1536*100}% ${y/1024*100}%`).join(',');
const shapePath=p=>'M'+p.map(a=>a.join(' ')).join('L')+'Z';
export function getVivianPackageHtml(){
    const clock=getVivianClockHandsHtml().replace('matrix(.7 -.27 0 1 666 612)','matrix(.085 -.033 0 .11 252 373)');
    return `<img class="vivian-package-background" src="${VIVIAN_PACKAGE_URL}" alt="비비안 잡화점 통합 룸" draggable="false">
        ${PACKAGE_OBJECTS.filter(o=>PACKAGE_PLACES.some(p=>p.id===o.id)&&o.id!=='counter').map(o=>`<button class="vivian-package-facility" data-package-place="${o.id}" aria-label="${PACKAGE_PLACES.find(p=>p.id===o.id).label}" style="clip-path:polygon(${clip(o.shape)})"></button>`).join('')}
        <button class="vivian-package-facility" data-package-place="wallShelf" aria-label="벽 선반 · 특수 장비" style="clip-path:polygon(${clip(PACKAGE_WALL_FIXTURES[0].shape)})"></button>
        <svg class="vivian-package-foreground" viewBox="0 0 1536 1024" aria-hidden="true"><defs><clipPath id="vivianPackageForeground"><path d=""/></clipPath></defs><image href="${VIVIAN_PACKAGE_URL}" width="1536" height="1024" clip-path="url(#vivianPackageForeground)"/></svg>
        <svg class="vivian-package-clock" viewBox="0 0 1536 1024" aria-hidden="true">${clock}</svg>`;
}
export function packageFloorClip(){return `polygon(${clip(PACKAGE_FLOOR)})`;}
export class VivianRoomPackage{
    constructor(room,onApply){this.room=room;this.active=false;this.enabled=false;this.items=[];this.pending=null;this.navigation=createVivianPackageNavigation();onApply(this.navigation);}
    cancel(){this.pending=null;}
    request(owner,id){const p=PACKAGE_PLACES.find(p=>p.id===id);if(!p||!owner.isOpen||owner.isShopping)return;owner.player.stop();if(!this.navigation.route(owner.player,p).length)return;this.pending=id;owner.player.moveTo(p.x,p.y);owner.interiorEl.focus({preventScroll:true});}
    updateInteractions(owner){
        if([...owner.player.keys].some(k=>['w','a','s','d'].includes(k))||owner.isShopping){this.pending=null;return;}
        const p=PACKAGE_PLACES.find(p=>p.id===this.pending);if(!p||Math.hypot(owner.player.x-p.x,owner.player.y-p.y)>5)return;
        this.pending=null;owner.player.stop();if(p.action==='exit')owner.close();else owner.showShop(p.tab);
    }
    syncClock(){this.room.querySelector('.vivian-package-clock').innerHTML=getVivianClockHandsHtml().replace('matrix(.7 -.27 0 1 666 612)','matrix(.085 -.033 0 .11 252 373)');}
    updatePlayerDepth(x,y){
        const paths=PACKAGE_OBJECTS.filter(o=>x+75>=Math.min(...o.shape.map(p=>p[0]))&&x-75<=Math.max(...o.shape.map(p=>p[0]))&&y<frontY(Math.max(Math.min(x,Math.max(...o.footprint.map(p=>p[0]))),Math.min(...o.footprint.map(p=>p[0]))),o.footprint)).map(o=>shapePath(o.shape)).join('');
        this.room.querySelector('#vivianPackageForeground path').setAttribute('d',paths);
    }
}
