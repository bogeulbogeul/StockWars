// Source-pixel geometry for the approved palette/official-logo v10 illustration.
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
export const SALON_ROOM = Object.freeze({ id: 'salon-de-tail-v10', width: 1254, height: 1254,
    characterScale: SALON_CHARACTER_REFERENCE.sourcePixelsPerUnit });
export const SALON_FLOOR = [[613,490],[1156,782],[610,1138],[82,782]];
export const SALON_OBJECTS = [
    { id:'console', footprint:[[668,543],[1075,772],[1075,801],[668,571]], silhouette:[[668,480],[1075,706],[1075,801],[668,571]] },
    { id:'chair-left', footprint:[[699,649],[735,633],[769,653],[769,673],[735,689],[697,668]], silhouette:[[679,546],[706,542],[735,557],[751,570],[770,581],[770,617],[751,641],[769,655],[769,674],[735,689],[698,670],[697,651],[710,638],[682,612]] },
    { id:'chair-back', footprint:[[820,730],[855,713],[895,735],[895,752],[858,769],[819,749]], silhouette:[[800,626],[828,622],[858,638],[875,649],[895,663],[895,698],[875,720],[895,738],[895,753],[858,770],[820,750],[818,732],[833,717],[802,693]] },
    { id:'chair-front', footprint:[[948,813],[985,797],[1025,819],[1025,839],[986,856],[946,834]], silhouette:[[926,713],[956,707],[985,723],[1004,736],[1028,750],[1028,784],[1005,807],[1025,821],[1025,840],[986,856],[947,835],[945,817],[959,802],[928,779]] },
    { id:'wash-left', footprint:[[386,625],[445,591],[531,642],[531,674],[475,708],[386,657]], silhouette:[[375,550],[411,517],[461,524],[467,562],[496,580],[531,625],[531,674],[475,708],[386,657]] },
    { id:'wash-back', footprint:[[497,552],[552,525],[642,575],[642,603],[587,637],[497,585]], silhouette:[[486,479],[521,452],[571,459],[577,497],[608,515],[642,557],[642,603],[587,637],[497,585]] },
    { id:'reception', footprint:[[173,767],[333,691],[434,730],[434,802],[278,868],[174,817]], silhouette:[[171,735],[219,697],[266,711],[351,672],[424,691],[434,726],[434,803],[278,869],[173,818]] },
    { id:'rear-plant', footprint:[[579,487],[612,470],[653,491],[650,514],[614,529],[580,507]], silhouette:[[563,431],[575,399],[591,372],[613,391],[636,371],[651,405],[671,422],[653,465],[653,491],[650,514],[614,529],[580,507]] }
];
export const SALON_BODIES = SALON_OBJECTS.map(o => ({ id:o.id, type:'static', polygon:o.footprint }));
export const SALON_PLAYER_BODY = Object.freeze({ type:'kinematic', radiusX:16, radiusY:8 });
export const SALON_PLACES = [
    { id:'exit', label:'카펫에서 마을로 나가기', x:455,y:940, hit:[[350,916],[421,870],[560,962],[489,1011]], action:'exit' },
    { id:'styles', label:'클레어와 대화하기', x:408,y:841, hit:[[229,573],[371,573],[371,711],[229,711]], action:'styles' },
    { id:'chair-left', label:'첫 번째 스타일링 의자', x:680,y:719, hit:SALON_OBJECTS[1].silhouette, seat:{x:729,y:675,direction:'up'} },
    { id:'chair-back', label:'두 번째 스타일링 의자', x:797,y:799, hit:SALON_OBJECTS[2].silhouette, seat:{x:851,y:756,direction:'up'} },
    { id:'chair-front', label:'세 번째 스타일링 의자', x:925,y:885, hit:SALON_OBJECTS[3].silhouette, seat:{x:979,y:842,direction:'up'} },
    { id:'wash', label:'샴푸석 이용 안내', x:550,y:702, hit:SALON_OBJECTS[4].silhouette, action:'wash' },
    { id:'wash-back', label:'안쪽 샴푸석 이용 안내', x:658,y:645, hit:SALON_OBJECTS[5].silhouette, action:'wash' }
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
