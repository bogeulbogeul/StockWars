import {cipherGridToScreen} from './CipherGrid.js';
export function cipherScreenToGrid(x,y){const a=(x-724)/65.6,b=(y-375)/33.5;return {u:(a+b)/2,v:(b-a)/2};}
export const CIPHER_STAIR_LANDING=cipherGridToScreen(3.5,1.5);
export function createCipherNavigation(getItems,size){
    let signature='',cachedCells=new Set(),frameCells=null;
    const blocked=()=>{
        const items=getItems(),next=items.map(i=>`${i.asset}:${i.u}:${i.v}:${i.rotation||0}`).join('|');
        if(next===signature)return cachedCells;
        const cells=new Set();for(let u=2;u<=5;u++)cells.add(`${u},0`);
        for(const i of items){if(['carpet','cornerDisplay'].includes(i.asset))continue;const [w,h]=size(i);for(let u=i.u;u<i.u+w;u++)for(let v=i.v;v<i.v+h;v++)cells.add(`${u},${v}`);}
        signature=next;cachedCells=cells;return cells;
    };
    const cell=p=>{const g=cipherScreenToGrid(p.x,p.y);return {u:Math.floor(g.u),v:Math.floor(g.v)};};
    const center=(u,v)=>cipherGridToScreen(u+.5,v+.5);
    const free=(u,v,cells)=>u>=0&&v>=0&&u<10&&v<10&&!cells.has(`${u},${v}`);
    const nav={
        beginFrame(){frameCells=blocked();},
        endFrame(){frameCells=null;},
        isWalkable(x,y){const g=cipherScreenToGrid(x,y),cells=frameCells||blocked();const pad=.24;for(const du of [-pad,pad])for(const dv of [-pad,pad])if(!free(Math.floor(g.u+du),Math.floor(g.v+dv),cells))return false;return true;},
        clamp(x,y){if(nav.isWalkable(x,y))return {x,y};let best=null,d=Infinity;const cells=blocked();for(let u=0;u<10;u++)for(let v=0;v<10;v++){if(!free(u,v,cells))continue;const p=center(u,v),distance=Math.hypot(p.x-x,p.y-y);if(distance<d){best=p;d=distance;}}return best||center(8,8);},
        route(start,end){const cells=blocked(),a=cell(start),b=cell(end),key=p=>`${p.u},${p.v}`;if(!free(a.u,a.v,cells)||!free(b.u,b.v,cells))return [];const queue=[a],parents=new Map([[key(a),null]]);for(let n=0;n<queue.length;n++){const p=queue[n];if(key(p)===key(b)){const path=[];for(let q=p;q;q=parents.get(key(q)))path.unshift(center(q.u,q.v));path.push(end);return path;}for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){const q={u:p.u+du,v:p.v+dv};if(free(q.u,q.v,cells)&&!parents.has(key(q))){parents.set(key(q),p);queue.push(q);}}}return [];},
        get places(){const carpet=getItems().find(i=>i.asset==='carpet');if(!carpet)return [{...nav.clamp(724,945),action:'exit'}];const [w,h]=size(carpet);return [{...center(carpet.u+(w-1)/2,carpet.v+(h-1)/2),action:'exit'}];}
    };return nav;
}
