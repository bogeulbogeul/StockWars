import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';

export const tourDistance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) / P);
export function resolveTourStop(goal, legal) {
    if (legal(goal.x, goal.y)) return goal;
    for (let radius = 8; radius <= 240; radius += 8) {
        for (let i = 0; i < 24; i++) {
            const angle = i * Math.PI * 2 / 24;
            const p = { x: goal.x + Math.sin(angle) * radius, y: goal.y + Math.cos(angle) * radius * P };
            if (legal(p.x, p.y)) return p;
        }
    }
    throw new Error('소개 장소 앞의 빈 공간을 찾지 못했어요.');
}
export function clearTourSegment(a, b, legal) {
    const steps = Math.max(1, Math.ceil(tourDistance(a, b) / 8));
    for (let i = 1; i <= steps; i++) {
        if (!legal(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps)) return false;
    }
    return true;
}
// Grid search routes around actual village footprints, then removes needless turns.
export function tourRoute(start, goal, legal, { step = 32 } = {}) {
    if (clearTourSegment(start, goal, legal)) return [start, goal];
    const key = p => `${p.x},${p.y}`;
    const origin = { x: Math.round(start.x / step) * step, y: Math.round(start.y / step) * step };
    const open = [], costs = new Map(), closed = new Set();
    function push(node) {
        open.push(node); let i = open.length - 1;
        while (i) { const parent = (i - 1) >> 1; if (open[parent].f <= node.f) break; open[i] = open[parent]; i = parent; }
        open[i] = node;
    }
    function pop() {
        const first = open[0], last = open.pop();
        if (open.length) {
            let i = 0;
            while (i * 2 + 1 < open.length) {
                let child = i * 2 + 1;
                if (child + 1 < open.length && open[child + 1].f < open[child].f) child++;
                if (open[child].f >= last.f) break;
                open[i] = open[child]; i = child;
            }
            open[i] = last;
        }
        return first;
    }
    // Connect to a nearby legal grid point without crossing an obstacle.
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
        const p = { x: origin.x + dx * step, y: origin.y + dy * step };
        if (!clearTourSegment(start, p, legal)) continue;
        const g = tourDistance(start, p); costs.set(key(p), g);
        push({ ...p, g, f: g + tourDistance(p, goal), parent: { ...start } });
    }
    let found;
    for (let count = 0; open.length && count < 80000; count++) {
        const node = pop(), id = key(node);
        if (closed.has(id)) continue;
        closed.add(id);
        if (tourDistance(node, goal) < 80 && clearTourSegment(node, goal, legal)) { found = node; break; }
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
            const p = { x: node.x + dx * step, y: node.y + dy * step };
            if (p.x < 0 || p.y < 0 || p.x > 6000 || p.y > 5000 || !clearTourSegment(node, p, legal)) continue;
            const g = node.g + tourDistance(node, p), k = key(p);
            if (g >= (costs.get(k) ?? Infinity)) continue;
            costs.set(k, g); push({ ...p, g, f: g + tourDistance(p, goal), parent: node });
        }
    }
    if (!found) throw new Error('마을 소개 이동 경로를 찾지 못했어요.');
    const route = [goal];
    for (let node = found; node; node = node.parent) route.unshift({ x: node.x, y: node.y });
    const smooth = [route[0]];
    for (let i = 0; i < route.length - 1;) {
        let next = route.length - 1;
        while (next > i + 1 && !clearTourSegment(route[i], route[next], legal)) next--;
        smooth.push(route[next]); i = next;
    }
    return smooth;
}

export function routeLength(route) { return route.slice(1).reduce((n, p, i) => n + tourDistance(route[i], p), 0); }
export function routePoint(route, distance) {
    for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], b = route[i], length = tourDistance(a, b);
        if (distance <= length) {
            const t = length ? Math.max(0, distance) / length : 1;
            return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        }
        distance -= length;
    }
    return route.at(-1);
}
