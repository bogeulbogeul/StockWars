import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { tourDistance, routeLength } from './TourRoute.js';

// Reserve the standing player's space before choosing the shelter's exit.
// Its platform starts inside the scenery mask, so allow only an initial exit
// from that footprint; after reaching clear ground, never re-enter a solid.
export function tourDeparture(start, goal, controller, paths, clearance) {
    const legal = controller.sceneryCanStand;
    const initialGap = Math.hypot(start.x - controller.charPosX, (start.y - controller.charPosY) / P);
    const occupied = p => Math.hypot(p.x - controller.charPosX, (p.y - controller.charPosY) / P) < Math.min(clearance, initialGap) - .001;
    const safeExit = end => {
        let outside = legal(start.x, start.y);
        const count = Math.max(1, Math.ceil(tourDistance(start, end) / 3));
        for (let i = 0; i <= count; i++) {
            const p = { x: start.x + (end.x - start.x) * i / count, y: start.y + (end.y - start.y) * i / count };
            if (occupied(p)) return false;
            const free = legal(p.x, p.y);
            if (outside && !free) return false;
            if (free) outside = true;
        }
        return outside;
    };
    const reserved = (x, y) => legal(x, y) && !occupied({ x, y });
    if (legal(start.x, start.y)) {
        // Keep the short road route; the moving controller makes a local pass
        // rather than treating the player as a permanent village-wide barrier.
        return { route: paths.route(start, goal, legal), exitLength: 0 };
    }
    const candidates = [];
    for (const dy of [24, 40, 56, 72, 88, 104]) for (const dx of [0, 40, 80, 120, 160, 200, -40, -80, -120]) {
        const end = { x: start.x + dx, y: start.y + dy };
        if (legal(end.x, end.y) && paths.onPath(end.x, end.y) && safeExit(end)) candidates.push(end);
    }
    candidates.sort((a, b) => tourDistance(start, a) - tourDistance(start, b));
    for (const exit of candidates) {
        try {
            const rest = paths.route(exit, goal, reserved);
            return { route: [start, ...rest], exitLength: routeLength([start, exit]) };
        } catch { /* Try another open side of the shelter. */ }
    }
    throw new Error('모아가 지나갈 빈 출발 공간을 찾지 못했어요.');
}
