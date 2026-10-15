// Measured on the unified 1536×1024 room. Breakroom furnishings stay outside this clear central floor.
export const WAREHOUSE_FLOOR = [[770,330],[1355,635],[770,950],[180,635]];
export const PARK = { x: 700, y: 590, height: 250 };
export const WAREHOUSE_ENTRANCE = { x: 1197, y: 680, halfWidth: 90, halfHeight: 52 };
// Rug edges follow the room perspective, rather than an axis-aligned diamond.
export const WAREHOUSE_RUG = [[1113,690],[1217,629],[1281,667],[1178,730]];
export function warehouseEntranceHit(x,y) { return WAREHOUSE_RUG.every((a,i)=>{const b=WAREHOUSE_RUG[(i+1)%4];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0])>=0;}); }
export const PARK_BODY = { type: 'static', x: PARK.x, y: PARK.y, radiusX: 58, radiusY: 32 };
export const PLAYER_BODY = { radiusX: 24, radiusY: 14 };
export const WAREHOUSE_PLACES = [{ id: 'exit', label: '마을로 나가기', x: 1100, y: 655 }, { id: 'park', label: '박씨 아저씨와 대화', x: 870, y: 665 }];
function inside(x,y) {
    return WAREHOUSE_FLOOR.every((a,i) => { const b=WAREHOUSE_FLOOR[(i+1)%4]; return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]) >= 0; });
}
export function warehouseWalkable(x,y) {
    if (!Number.isFinite(x)||!Number.isFinite(y)) return false;
    if (![[24,0],[-24,0],[0,14],[0,-14]].every(([dx,dy])=>inside(x+dx,y+dy))) return false;
    // Expand the immovable NPC body by the player's footprint so their bodies cannot overlap.
    return ((x-PARK_BODY.x)/(PARK_BODY.radiusX+PLAYER_BODY.radiusX))**2+((y-PARK_BODY.y)/(PARK_BODY.radiusY+PLAYER_BODY.radiusY))**2 > 1;
}
export function createWarehouseNavigation() {
    const segment=(a,b)=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3));for(let i=0;i<=steps;i++)if(!warehouseWalkable(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;return true;};
    const anchors = [[-100,0],[100,0],[-80,-60],[80,-60],[-80,60],[80,60],[0,75],[0,-75]].map(([x,y])=>({x:PARK.x+x,y:PARK.y+y})).filter(p=>warehouseWalkable(p.x,p.y));
    return { places: WAREHOUSE_PLACES, isWalkable: warehouseWalkable, segment,
        clamp(x,y) {
            if(warehouseWalkable(x,y))return {x,y};
            let best=WAREHOUSE_PLACES[0],distance=Infinity;
            for(let sy=350;sy<940;sy+=12)for(let sx=190;sx<1350;sx+=12)if(warehouseWalkable(sx,sy)) {const d=Math.hypot(sx-x,sy-y);if(d<distance){distance=d;best={x:sx,y:sy};}}
            return {...best};
        },
        route(start,end) {
            if(!warehouseWalkable(start.x,start.y)||!warehouseWalkable(end.x,end.y))return [];
            if(segment(start,end))return [end];
            const nodes=[start,...anchors,end], costs=new Map([[start,0]]), parents=new Map(), open=new Set([start]);
            while(open.size){const current=[...open].sort((a,b)=>costs.get(a)-costs.get(b))[0];open.delete(current);
                if(current===end){const path=[];for(let p=end;p!==start;p=parents.get(p))path.unshift({x:p.x,y:p.y});return path;}
                for(const next of nodes){if(next===current||!segment(current,next))continue;const cost=costs.get(current)+Math.hypot(current.x-next.x,current.y-next.y);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);parents.set(next,current);open.add(next);}}
            }
            return [];
        }
    };
}
