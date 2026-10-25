import { villagePathRoutes, TOWN_PLAZA } from '../../data/townLandscapeLayout.js';
import { tourDistance, clearTourSegment, tourRoute } from './TourRoute.js';

// Match the rounded centerlines used by the visible ground texture.
function roundedRoute(route) {
    const points = [route[0]];
    for (let i = 1; i < route.length - 1; i++) {
        const a = route[i - 1], b = route[i], c = route[i + 1];
        const before = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const after = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const r = Math.min(100, before / 2, after / 2);
        if (!before || !after) continue;
        const enter = b.map((v, k) => v + (a[k] - v) * r / before);
        const leave = b.map((v, k) => v + (c[k] - v) * r / after);
        points.push(enter);
        for (let j = 1; j <= 20; j++) {
            const t = j / 20;
            points.push(b.map((v, k) => (1 - t) ** 2 * enter[k] + 2 * (1 - t) * t * v + t * t * leave[k]));
        }
    }
    points.push(route.at(-1));
    return points;
}

export function createTourPaths({ routes = villagePathRoutes() } = {}) {
    const segments = [], candidates = [];
    for (const [index, route] of routes.entries()) {
        const points = roundedRoute(route), radius = 25 * (index === 0 ? 1.15 : index === 2 ? 1 : .76);
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1], b = points[i];
            segments.push({ a, b, radius });
            const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8));
            for (let n = 0; n <= count; n++) candidates.push({ x: a[0] + (b[0] - a[0]) * n / count, y: a[1] + (b[1] - a[1]) * n / count });
        }
    }
    const plaza = TOWN_PLAZA;
    for (let i = 0; i < 180; i++) {
        const angle = i * Math.PI * 2 / 180;
        candidates.push({ x: plaza.x + Math.cos(angle) * (plaza.radiusX - 8), y: plaza.y + Math.sin(angle) * (plaza.radiusY - 8) });
    }
    const onPath = (x, y, margin = 0) => {
        if (((x - plaza.x) / (plaza.radiusX - margin)) ** 2 + ((y - plaza.y) / (plaza.radiusY - margin)) ** 2 <= 1) return true;
        return segments.some(({ a, b, radius }) => {
            const dx = b[0] - a[0], dy = b[1] - a[1];
            const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
            return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) <= radius - margin;
        });
    };
    const anchor = (point, legal, connector = false) => {
        if (onPath(point.x, point.y) && legal(point.x, point.y)) return point;
        const sorted = candidates.map(p => ({ p, distance: tourDistance(point, p) })).sort((a, b) => a.distance - b.distance);
        for (const { p, distance } of sorted) {
            if (distance > 400) break;
            if (legal(p.x, p.y) && (!connector || clearTourSegment(point, p, legal))) return p;
        }
        throw new Error('소개 장소와 연결된 길을 찾지 못했어요.');
    };
    return {
        onPath,
        route(start, destination, legal) {
            const from = anchor(start, legal, true), to = anchor(destination, legal);
            const pathLegal = (x, y) => legal(x, y) && onPath(x, y, 2);
            const route = tourRoute(from, to, pathLegal, { step: 12 });
            return tourDistance(start, from) > .01 ? [start, ...route] : route;
        }
    };
}
