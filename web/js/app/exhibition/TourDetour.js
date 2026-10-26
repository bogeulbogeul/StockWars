import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { tourRoute, routePoint, routeLength, tourDistance } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';

// A short local pass around the player, returning to the same paved route.
// Grass is allowed only in the immediate passing area, never as a shortcut
// across the village. Buildings and the player's body remain solid.
export function findTourDetour(route, progress, controller, paths, clearance) {
    const start = routePoint(route, progress), length = routeLength(route);
    const px = controller.charPosX, py = controller.charPosY;
    const startGap = Math.hypot(start.x - px, (start.y - py) / P);
    const radius = Math.min(clearance + 18, startGap);
    for (const distance of [160, 240, 320, 440, 600]) {
        const rejoinAt = Math.min(length, progress + distance), end = routePoint(route, rejoinAt);
        if (tourDistance(start, end) < 40 || Math.hypot(end.x - px, (end.y - py) / P) < clearance + 10) continue;
        const legal = (x, y, minimum = radius) => {
            const gap = Math.hypot(x - px, (y - py) / P);
            return gap >= minimum && controller.sceneryCanStand(x, y)
                && x >= Math.min(start.x, end.x) - 240 && x <= Math.max(start.x, end.x) + 240
                && y >= Math.min(start.y, end.y) - 240 * P && y <= Math.max(start.y, end.y) + 240 * P
                && (paths.onPath(x, y) || gap <= clearance + 160);
        };
        try {
            const bypass = tourRoute(start, end, legal, { step: 12 });
            // Keep the rest of the original path after its rejoin point.
            const tail = [];
            let traversed = 0;
            for (let i = 1; i < route.length; i++) {
                traversed += tourDistance(route[i - 1], route[i]);
                if (traversed > rejoinAt + .01) tail.push(route[i]);
            }
            return roundTourRoute([...bypass, ...tail], (x, y) => legal(x, y, Math.min(clearance, startGap)));
        } catch { /* Look for a slightly later rejoin without moving the player. */ }
    }
    return null;
}
