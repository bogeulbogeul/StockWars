// Coordinates measured on the 1760 × 894 room illustration.
// clean-v7 redraw retains the clean-v6 layout; lounge group moves (-49, +36) from clean-v4; doors stay fixed.
// This map belongs to this package; legacy furnishing/save coordinates are untouched.
export const ROOM_SIZE = {width:1760,height:894};
export const FLOOR = [[887,285],[1480,563],[860,856],[239,565]];
export const DESK = [[447,451],[730,315],[828,350],[829,451],[815,474],[571,585],[493,584],[447,563]];
export const OBJECTS = [
    {id:'desk', footprint:[[455,515],[803,383],[816,468],[571,584],[486,579]], silhouette:DESK},
    {id:'sofa-left', depth:[[866,609],[1025,528],[1062,559],[915,635]], footprint:[[867,586],[1024,519],[1062,559],[915,635]], silhouette:[[866,562],[872,558],[872,544],[1005,477.5],[1010,478],[1024,483],[1025,498],[1038,505],[1042,504],[1062,515],[1062,550],[1057,554],[1057,559],[935,622],[935,624],[929,626],[925,626],[915,635],[909,633],[906,631],[871,614],[871,612],[866,609]]},
    {id:'sofa-right', depth:[[1148,602],[1191,579],[1318,640],[1268,668]], footprint:[[1148,602],[1191,579],[1318,640],[1268,668]], silhouette:[[1146,557],[1185,537],[1185,522],[1188,518],[1196,514.5],[1313,572],[1313,586],[1319,589],[1319,640],[1312,645],[1271,665],[1263,663.5],[1258,660],[1258,659],[1148,604],[1148,600],[1146,597]]},
    {id:'table', depth:[[973,653],[1074,602],[1169,650],[1065,702]], footprint:[[973,653],[1074,602],[1169,650],[1065,702]], silhouette:[[973,614],[1074,572],[1169,614],[1169,626],[1065,670],[973,627]]},
    {id:'plant-left',footprint:[[376,516],[412,501],[444,518],[412,546]],silhouette:[[369,474],[383,447],[410,433],[426,455],[450,444],[445,487],[438,499],[445,527],[410,552],[379,538]]},
    {id:'plant-back',footprint:[[818,300],[883,272],[938,292],[874,331]],silhouette:[[803,274],[824,256],[839,239],[853,252],[873,232],[889,250],[913,232],[938,262],[939,300],[874,335],[815,311]]},
    {id:'brochures',footprint:[[433,555],[480,531],[505,555],[478,584]],silhouette:[[449,472],[484,486],[505,501],[505,558],[478,584],[433,563]]}
];
export const PLACES = [
    {id:'exit',label:'마을로 나가기',x:566,y:668,hit:[[444,654],[528,614],[671,684],[586,726]]},
    {id:'agent',label:'토리와 대화하기',x:669,y:585,hit:[[450,453],[605,294],[662,298],[825,355],[814,471],[570,583],[454,561]]},
    {id:'training',label:'트레이닝룸 이동',x:320,y:570,hit:[[266,375],[342,338],[342,519],[266,558]]},
    {id:'competition',label:'모의투자 경쟁룸 이동',x:1400,y:571,hit:[[1367,321],[1461,369],[1461,558],[1367,510]]},
    {id:'elevator',label:'엘리베이터 이용',x:1139,y:433,hit:[[1093,198],[1197,249],[1197,424],[1093,375]]}
];
export const SEATS = [
    {id:'lounge-left',sofa:'sofa-left',x:949,y:567,approach:{x:934,y:654}},
    {id:'lounge-right',sofa:'sofa-right',x:1220,y:598.5,approach:{x:1211,y:676}}
];
export function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function frontY(x,polygon){const ys=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&a[0]!==b[0])ys.push(a[1]+(x-a[0])/(b[0]-a[0])*(b[1]-a[1]));}return ys.length?Math.max(...ys):-Infinity;}
// Decide depth once per actor/object using the foot anchor. Splitting a sprite
// into X ranges creates artificial vertical cuts through its face and body.
export function actorIsBehind(pose,object){
    const polygon=object.depth||object.footprint;
    const xs=polygon.map(p=>p[0]),lo=Math.min(...xs),hi=Math.max(...xs);
    if(pose.x+40<lo||pose.x-40>hi)return false;
    const x=Math.max(lo,Math.min(hi,pose.x));
    return pose.y<frontY(x,polygon);
}
export const PLAYER_COLLIDER={radiusX:10,radiusY:5};
// Unified art has no movable foreground cutouts. Keep the full standing
// character out of the projected area of any object in front of it.
const TABLE_PLANT=[[1029,551],[1111,551],[1111,638],[1029,638]];
function polygonTouchesRect(polygon,left,top,right,bottom){
    if(polygon.every(p=>p[0]<left)||polygon.every(p=>p[0]>right)||polygon.every(p=>p[1]<top)||polygon.every(p=>p[1]>bottom))return false;
    if(polygon.some(([x,y])=>x>=left&&x<=right&&y>=top&&y<=bottom))return true;
    if([[left,top],[right,top],[right,bottom],[left,bottom]].some(([x,y])=>inside(x,y,polygon)))return true;
    // Segment versus rectangle (Liang–Barsky); catches sloping edges crossing
    // the character even when no polygon or rectangle vertex lies inside.
    return polygon.some((a,i)=>{
        const b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dy=b[1]-a[1];let lo=0,hi=1;
        for(const [p,q] of [[-dx,a[0]-left],[dx,right-a[0]],[-dy,a[1]-top],[dy,bottom-a[1]]]){
            if(p===0){if(q<0)return false;continue;}
            const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
        }return true;
    });
}
export function overlapsForeground(x,y){
    // The counter's top projects past its ground footprint. Keep the entire
    // foot/shadow off that projection, including its raised right-hand corner.
    if(polygonTouchesRect(DESK,x-34,y-10,x+34,y+14))return true;
    return OBJECTS.some(o=>actorIsBehind({x,y},o)&&[o.silhouette,...(o.id==='table'?[TABLE_PLANT]:[])].some(p=>polygonTouchesRect(p,x-30,y-65,x+30,y+(o.id==='desk'?14:0))));
}
function touchesBoundary(x,y,polygon){
    return polygon.some((a,i)=>{
        const b=polygon[(i+1)%polygon.length],ax=(a[0]-x)/PLAYER_COLLIDER.radiusX,ay=(a[1]-y)/PLAYER_COLLIDER.radiusY;
        const dx=(b[0]-a[0])/PLAYER_COLLIDER.radiusX,dy=(b[1]-a[1])/PLAYER_COLLIDER.radiusY;
        const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
        return Math.hypot(ax+t*dx,ay+t*dy)<=1;
    });
}
export function createPackageNavigation(){
    // Static rigid bodies: furniture never moves; the player's ground ellipse
    // collides with every edge and corner, rather than five sampled points.
    const bodies=OBJECTS.map(o=>({id:o.id,type:'static',polygon:o.footprint}));
    const walk=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&inside(x,y,FLOOR)&&!touchesBoundary(x,y,FLOOR)&&!bodies.some(b=>inside(x,y,b.polygon)||touchesBoundary(x,y,b.polygon))&&!overlapsForeground(x,y);
    const segment=(a,b)=>{const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let i=0;i<=steps;i++)if(!walk(a.x+(b.x-a.x)*i/(steps||1),a.y+(b.y-a.y)*i/(steps||1)))return false;return true;};
    const nodes=[];const map=new Map();
    for(let y=300;y<850;y+=4)for(let x=250;x<1490;x+=4)if(walk(x,y)){const p={x,y,index:nodes.length};nodes.push(p);map.set(`${x},${y}`,p);}
    // The passage behind the right sofa needs a 4px grid. Cache its static
    // graph so subsequent clicks do not repeat expensive silhouette checks.
    const neighbours=new Map();
    const adjacent=p=>{
        if(!neighbours.has(p.index))neighbours.set(p.index,[[4,0],[-4,0],[0,4],[0,-4],[4,4],[-4,4],[4,-4],[-4,-4]].map(([dx,dy])=>map.get(`${p.x+dx},${p.y+dy}`)).filter(n=>n&&segment(p,n)));
        return neighbours.get(p.index);
    };
    const nearest=p=>nodes.reduce((best,n)=>Math.hypot(n.x-p.x,n.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?n:best,nodes[0]);
    const nav={bodies,beginFrame(){},endFrame(){},isWalkable:walk,segment,
        clamp(x,y){return walk(x,y)?{x,y}:nearest({x,y});},
        route(start,end){
            if(!walk(start.x,start.y)||!walk(end.x,end.y))return [];
            if(segment(start,end))return [end];
            const attach=p=>{
                const candidates=nodes.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<36).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)),attached=[];
                for(const n of candidates)if(segment(p,n)){attached.push(n);if(attached.length===8)break;}
                return attached;
            };
            const starts=attach(start),ends=new Set(attach(end).map(n=>n.index));if(!starts.length||!ends.size)return [];
            // A* visits the corridor toward the target instead of flooding
            // the whole room on the first click (which can stall a frame).
            const heap=[],parents=new Map(),costs=new Map();
            const push=(p,g)=>{const item={p,g,f:g+Math.hypot(p.x-end.x,p.y-end.y)};let i=heap.length;heap.push(item);while(i){const parent=(i-1)>>1;if(heap[parent].f<=item.f)break;heap[i]=heap[parent];i=parent;}heap[i]=item;};
            const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
            for(const p of starts){const g=Math.hypot(p.x-start.x,p.y-start.y);parents.set(p.index,null);costs.set(p.index,g);push(p,g);}
            while(heap.length){const {p,g}=pop();if(g!==costs.get(p.index))continue;if(ends.has(p.index)){const path=[end];for(let q=p;q;q=parents.get(q.index))path.unshift({x:q.x,y:q.y});return path;}
                for(const n of adjacent(p)){const next=g+Math.hypot(n.x-p.x,n.y-p.y);if(next<(costs.get(n.index)??Infinity)){parents.set(n.index,p);costs.set(n.index,next);push(n,next);}}
            }return [];
        },
        places:[{...PLACES[0],action:'exit'}]
    };return nav;
}
