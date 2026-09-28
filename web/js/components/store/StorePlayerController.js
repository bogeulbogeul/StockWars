// Background-space coordinates (1536 x 1024). This convex floor stays clear
// of the rear shelves, fridge, counter, plants, and the cutaway floor edges.
export const STORE_FLOOR = [
    { x: 180, y: 650 }, { x: 760, y: 420 },
    { x: 1250, y: 695 }, { x: 768, y: 920 }
];
export const STORE_PLACES = [
    { x: 455, y: 560, action: 'exit', label: '나가기' },
    { x: 1150, y: 675, action: 'shop', label: '계산대' }
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
    reset() {
        this.x = STORE_PLACES[0].x;
        this.y = STORE_PLACES[0].y;
        this.facing = 1;
        this.phase = 0;
        this.target = null;
        this.moving = false;
        this.keys = new Set();
    }
    stop() { this.keys.clear(); this.target = null; this.phase = 0; this.moving = false; }
    moveTo(x, y) {
        if (Number.isFinite(x) && Number.isFinite(y)) this.target = clampToStoreFloor(x, y);
    }
    update(dt) {
        dt = Math.max(0, Math.min(dt, 0.05));
        let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
        let dy = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
        const speed = this.keys.has('shift') ? 504 : 280;
        if (dx || dy) this.target = null;
        else if (this.target) { dx = this.target.x - this.x; dy = this.target.y - this.y; }
        const length = Math.hypot(dx, dy);
        const distance = Math.min(speed * dt, this.target ? length : Infinity);
        const before = { x: this.x, y: this.y };
        if (length) Object.assign(this, clampToStoreFloor(this.x + dx / length * distance, this.y + dy / length * distance));
        if (dx) this.facing = Math.sign(dx);
        if (this.target && Math.hypot(this.target.x - this.x, this.target.y - this.y) < 0.1) this.target = null;
        this.moving = Math.hypot(this.x - before.x, this.y - before.y) > 0.001;
        this.phase = this.moving ? this.phase + dt * (speed > 280 ? 15 : 9.5) : 0;
    }
    nearby() {
        return STORE_PLACES.find(place => Math.hypot(place.x - this.x, place.y - this.y) < 90) || null;
    }
}
