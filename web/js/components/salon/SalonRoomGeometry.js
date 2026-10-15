// Source-pixel geometry for the approved salon-with-claire-v9 illustration.
// Retain its native aspect ratio; exact common-grid conformity remains an art limitation.
import { CHARACTER_HEIGHT } from '../../data/characterScale.js';
// Claire's full standing body is obscured by the counter. The reference sheet's
// crown/sole and eye landmarks give an approximately 189px standing height in
// this room illustration. Treat that as H=90, not as an extra character size.
export const SALON_CHARACTER_REFERENCE = Object.freeze({
    claireHeight: CHARACTER_HEIGHT, playerHeight: CHARACTER_HEIGHT,
    sourceStandingHeight: 189, sourcePixelsPerUnit: 189 / CHARACTER_HEIGHT,
    measurement: 'reference-sheet estimate; legs obscured in unified room'
});
export const SALON_ROOM = Object.freeze({ id: 'salon-de-tail-v9', width: 1216, height: 1294,
    characterScale: SALON_CHARACTER_REFERENCE.sourcePixelsPerUnit });
export const SALON_FLOOR = [[613,452],[1184,790],[598,1160],[36,790]];
export const SALON_OBJECTS = [
    { id:'console', footprint:[[658,506],[1094,758],[1094,783],[658,531]], silhouette:[[655,431],[1095,684],[1095,783],[655,532]] },
    { id:'chair-left', footprint:[[681,611],[710,596],[750,618],[750,635],[716,649],[680,630]], silhouette:[[656,510],[687,506],[715,525],[731,530],[752,549],[752,582],[735,604],[750,620],[747,635],[716,650],[681,636],[677,620],[690,606],[659,580]] },
    { id:'chair-back', footprint:[[790,701],[821,685],[865,708],[865,726],[828,741],[790,722]], silhouette:[[778,601],[808,596],[837,615],[852,620],[875,638],[875,670],[851,695],[865,712],[861,727],[829,741],[792,727],[788,712],[801,696],[780,673]] },
    { id:'chair-front', footprint:[[930,793],[966,778],[1009,802],[1009,820],[973,835],[930,817]], silhouette:[[916,692],[945,687],[974,704],[992,712],[1018,733],[1018,762],[995,788],[1009,805],[1005,822],[972,835],[934,821],[929,805],[943,790],[918,768]] },
    { id:'wash-left', footprint:[[365,584],[429,551],[528,610],[528,640],[465,676],[365,617]], silhouette:[[355,495],[395,471],[446,480],[450,522],[483,532],[528,587],[528,641],[465,677],[365,618]] },
    { id:'wash-back', footprint:[[484,506],[545,475],[639,531],[639,557],[575,595],[484,539]], silhouette:[[474,421],[514,397],[563,407],[568,449],[602,458],[639,507],[639,558],[576,596],[484,540]] },
    { id:'reception', footprint:[[124,738],[326,645],[420,688],[420,781],[256,865],[125,799]], silhouette:[[122,693],[187,655],[229,672],[331,622],[411,651],[420,684],[420,784],[256,866],[125,800]] },
    { id:'rear-plant', footprint:[[569,440],[613,421],[659,444],[649,467],[611,482],[572,460]], silhouette:[[553,354],[575,337],[582,303],[611,324],[637,303],[647,335],[672,346],[656,388],[659,443],[649,467],[612,482],[571,460],[568,406]] }
];
export const SALON_BODIES = SALON_OBJECTS.map(o => ({ id:o.id, type:'static', polygon:o.footprint }));
export const SALON_PLAYER_BODY = Object.freeze({ type:'kinematic', radiusX:16, radiusY:8 });
export const SALON_PLACES = [
    { id:'exit', label:'카펫에서 마을로 나가기', x:421,y:946, hit:[[303,936],[382,886],[546,997],[468,1052]], action:'exit' },
    { id:'styles', label:'클레어와 스타일 상담', x:384,y:836, hit:[[190,540],[344,540],[344,695],[190,695]], action:'styles' },
    { id:'chair-left', label:'첫 번째 스타일링 의자', x:678,y:687, hit:SALON_OBJECTS[1].silhouette, seat:{x:707,y:579,direction:'up'} },
    { id:'chair-back', label:'두 번째 스타일링 의자', x:785,y:779, hit:SALON_OBJECTS[2].silhouette, seat:{x:827,y:670,direction:'up'} },
    { id:'chair-front', label:'세 번째 스타일링 의자', x:916,y:873, hit:SALON_OBJECTS[3].silhouette, seat:{x:967,y:762,direction:'up'} },
    { id:'wash', label:'샴푸석 이용 안내', x:543,y:663, hit:SALON_OBJECTS[4].silhouette, action:'wash' },
    { id:'wash-back', label:'안쪽 샴푸석 이용 안내', x:646,y:603, hit:SALON_OBJECTS[5].silhouette, action:'wash' }
];
export function inside(x,y,polygon) {
    let result=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
        const a=polygon[i],b=polygon[j];
        if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) result=!result;
    }
    return result;
}
function touches(x,y,polygon) {
    const {radiusX:rx,radiusY:ry}=SALON_PLAYER_BODY;
    return polygon.some((a,i)=>{
        const b=polygon[(i+1)%polygon.length],ax=(a[0]-x)/rx,ay=(a[1]-y)/ry,dx=(b[0]-a[0])/rx,dy=(b[1]-a[1])/ry;
        const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
        return Math.hypot(ax+t*dx,ay+t*dy)<=1;
    });
}
export function salonWalkable(x,y) {
    return Number.isFinite(x)&&Number.isFinite(y)&&inside(x,y,SALON_FLOOR)&&!touches(x,y,SALON_FLOOR)
        &&!SALON_BODIES.some(b=>inside(x,y,b.polygon)||touches(x,y,b.polygon));
}
export function salonBehind(foot,object) {
    const polygon=object.footprint,xs=polygon.map(p=>p[0]);
    if(foot.x<Math.min(...xs)-75||foot.x>Math.max(...xs)+75)return false;
    const x=Math.max(Math.min(...xs)+.01,Math.min(Math.max(...xs)-.01,foot.x));
    const ys=[];
    polygon.forEach((a,i)=>{const b=polygon[(i+1)%polygon.length];if(a[0]!==b[0]&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0]))ys.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));});
    return foot.y<Math.max(...ys);
}
export function createSalonNavigation() {
    const segment=(a,b)=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3));for(let i=0;i<=steps;i++)if(!salonWalkable(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;};
    const nodes=[],map=new Map(),spacing=16;
    for(let y=464;y<1168;y+=spacing)for(let x=32;x<1200;x+=spacing)if(salonWalkable(x,y)){const n={x,y};nodes.push(n);map.set(`${x},${y}`,n);}
    const attach=p=>nodes.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<48&&segment(p,n)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,8);
    return {bodies:SALON_BODIES,places:SALON_PLACES,isWalkable:salonWalkable,segment,
        clamp(x,y){return salonWalkable(x,y)?{x,y}:nodes.reduce((best,n)=>Math.hypot(n.x-x,n.y-y)<Math.hypot(best.x-x,best.y-y)?n:best,nodes[0]);},
        route(start,end){
            if(!salonWalkable(start.x,start.y)||!salonWalkable(end.x,end.y))return [];
            if(segment(start,end))return [end];
            const starts=attach(start),ends=new Set(attach(end)),open=new Set(starts),cost=new Map(),parent=new Map();
            starts.forEach(n=>{cost.set(n,Math.hypot(n.x-start.x,n.y-start.y));parent.set(n,null);});
            while(open.size){
                let current,score=Infinity;
                for(const n of open){const s=cost.get(n)+Math.hypot(n.x-end.x,n.y-end.y);if(s<score){current=n;score=s;}}
                open.delete(current);
                if(ends.has(current)){const path=[end];for(let n=current;n;n=parent.get(n))path.unshift({x:n.x,y:n.y});return path;}
                for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16],[16,16],[16,-16],[-16,16],[-16,-16]]){
                    const n=map.get(`${current.x+dx},${current.y+dy}`);if(!n||!segment(current,n))continue;
                    const next=cost.get(current)+Math.hypot(dx,dy);
                    if(next<(cost.get(n)??Infinity)){cost.set(n,next);parent.set(n,current);open.add(n);}
                }
            }
            return [];
        }
    };
}
