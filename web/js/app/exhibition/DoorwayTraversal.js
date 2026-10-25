import { MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { tourRoute } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';

// Finish the approach before entering the jamb: no diagonal corner cutting through walls.
export function doorwayRoute(start, door, canStand) {
    const approach = { x: door.center.x, y: (door.center.z + (door.approachDistance || 100)) * P };
    const end = { x: door.center.x, y: (door.center.z - 10) * P };
    const lane = Math.max(4, Math.min(12, door.width / 2 - 36));
    const legal = (x, y) => canStand(x, y) || (Math.abs(x - door.center.x) <= lane
        && y >= end.y - 1 && y <= approach.y + 1);
    if (Math.abs(start.x - door.center.x) <= lane && start.y >= end.y && start.y <= approach.y) return [start, end];
    return [...roundTourRoute(tourRoute(start, approach, legal, { step: 12 }), legal), end];
}
export function doorwayHeight(door, z) {
    return Math.max(0, door.floorY) * MathUtils.smoothstep((door.center.z + 150 - z) / 150, 0, 1);
}
