import { tourDistance, clearTourSegment } from './TourRoute.js';

// Round corners only when every sample still clears the player and scenery.
export function roundTourRoute(route, legal) {
    const result = [route[0]];
    for (let i = 1; i < route.length - 1; i++) {
        const a = route[i - 1], b = route[i], c = route[i + 1];
        const before = tourDistance(a, b), after = tourDistance(b, c);
        const radius = Math.min(65, before * .4, after * .4);
        if (radius < 4) { result.push(b); continue; }
        const enter = { x: b.x + (a.x - b.x) * radius / before, y: b.y + (a.y - b.y) * radius / before };
        const leave = { x: b.x + (c.x - b.x) * radius / after, y: b.y + (c.y - b.y) * radius / after };
        const curve = [enter], count = Math.ceil(radius * 2 / 3);
        for (let j = 1; j <= count; j++) {
            const t = j / count;
            curve.push({ x: (1-t)**2*enter.x+2*(1-t)*t*b.x+t*t*leave.x,
                y: (1-t)**2*enter.y+2*(1-t)*t*b.y+t*t*leave.y });
        }
        const safe = curve.every(p => legal(p.x, p.y))
            && clearTourSegment(result.at(-1), enter, legal)
            && curve.slice(1).every((p, j) => clearTourSegment(curve[j], p, legal));
        if (safe) result.push(...curve);
        else result.push(b);
    }
    result.push(route.at(-1));
    return result;
}
