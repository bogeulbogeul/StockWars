// Background-space coordinates (1536 x 1024). This convex floor stays clear
// of the rear shelves, fridge, counter, plants, and the cutaway floor edges.
export const STORE_FLOOR = [
    { x: 520, y: 650 }, { x: 760, y: 470 },
    { x: 1100, y: 610 }, { x: 1200, y: 750 },
    { x: 990, y: 890 }, { x: 800, y: 890 }
];
export const STORE_PLACES = [
    { x: 1040, y: 820, action: 'exit', label: '나가기' },
    { x: 630, y: 730, action: 'shop', label: '계산대' }
];

export function isOnStoreFloor(x, y) {
    return STORE_FLOOR.every((a, i) => {
        const b = STORE_FLOOR[(i + 1) % STORE_FLOOR.length];
        return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) >= -0.001;
    });
}

export function clampToStoreFloor(x, y) {
    if (isOnStoreFloor(x, y)) return { x, y };
    let closest, distance = Infinity;
    STORE_FLOOR.forEach((a, i) => {
        const b = STORE_FLOOR[(i + 1) % STORE_FLOOR.length];
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
        const point = { x: a.x + t * dx, y: a.y + t * dy };
        const d = Math.hypot(x - point.x, y - point.y);
        if (d < distance) { closest = point; distance = d; }
    });
    return closest;
}

export class StorePlayerController {
    constructor() { this.reset(); }
    configureRoom(navigation) { this.navigation = navigation; this.reset(); }
    get places() { return this.navigation?.places || STORE_PLACES; }
    reset() {
        this.x = this.places[0].x;
        this.y = this.places[0].y;
        this.facing = 1;
        this.phase = 0;
        this.target = null;
        this.waypoints = [];
        this.moving = false;
        this.keys = new Set();
    }
    stop() { this.keys.clear(); this.target = null; this.waypoints = []; this.phase = 0; this.moving = false; }
    moveTo(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        const target = (this.navigation?.clamp || clampToStoreFloor)(x,y);
        if (this.navigation) {
            this.waypoints = this.navigation.route(this,target);
            this.target = this.waypoints.shift() || null;
        } else this.target = target;
    }
    update(dt) {
        // Spend the remaining frame time on the next waypoint instead of
        // dropping it at every tile centre, which makes click movement stutter.
        dt = Math.max(0, Math.min(dt, 0.05));
        const keyboard=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].some(key=>this.keys.has(key));
        if(keyboard||!this.target){this.updateStep(dt);return;}
        const speed=this.keys.has('shift')?504:280;
        let remaining=dt,moved=false;
        for(let n=0;n<128&&this.target&&remaining>0;n++){
            const duration=Math.min(remaining,Math.hypot(this.target.x-this.x,this.target.y-this.y)/speed);
            const previousTarget=this.target;
            this.updateStep(duration);moved||=this.moving;
            remaining-=duration;
            if(this.target===previousTarget)break;
        }
        this.moving=moved;
    }
    updateStep(dt) {
        dt = Math.max(0, Math.min(dt, 0.05));
        let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
        let dy = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
        const speed = this.keys.has('shift') ? 504 : 280;
        if (dx || dy) { this.target = null; this.waypoints = []; }
        else if (this.target) { dx = this.target.x - this.x; dy = this.target.y - this.y; }
        const length = Math.hypot(dx, dy);
        const distance = Math.min(speed * dt, this.target ? length : Infinity);
        const before = { x: this.x, y: this.y };
        if (length) {
            const nx=this.x+dx/length*distance, ny=this.y+dy/length*distance;
            if (!this.navigation) Object.assign(this,clampToStoreFloor(nx,ny));
            else {
                // Substeps prevent crossing a blocked tile on a single fast frame.
                const steps=Math.ceil(distance/3);
                for(let i=0;i<steps;i++) {
                    const sx=this.x+dx/length*distance/steps, sy=this.y+dy/length*distance/steps;
                    if(this.navigation.isWalkable(sx,sy)) { this.x=sx; this.y=sy; }
                    else if(this.navigation.isWalkable(sx,this.y)) this.x=sx;
                    else if(this.navigation.isWalkable(this.x,sy)) this.y=sy;
                }
            }
        }
        if (dx) this.facing = Math.sign(dx);
        if (this.target && Math.hypot(this.target.x - this.x, this.target.y - this.y) < 0.1) this.target = this.waypoints.shift() || null;
        this.moving = Math.hypot(this.x - before.x, this.y - before.y) > 0.001;
        this.phase = this.moving ? this.phase + dt * (speed > 280 ? 15 : 9.5) : 0;
    }
    nearby() {
        // The foreground exit is close to checkout; choose the nearest action.
        let nearest = null, distance = 90;
        for (const place of this.places) {
            const d = Math.hypot(place.x - this.x, place.y - this.y);
            if (d < distance) { nearest = place; distance = d; }
        }
        return nearest;
    }
}
