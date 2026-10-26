import { quickMoaExit } from './QuickMoaExit.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { INFORMATION_OBSTACLES } from '../../data/informationObstacles.js';
import { animate } from './HandoffMotion.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';
import { createInformationDoor } from './InformationDoor.js';
import { doorwayHeight } from './DoorwayTraversal.js';
import { dismountPlayerSeat } from './PlayerSeatDismount.js';
import { walkRoomTo } from '../OnFootNavigation.js';
import { PLAYER_BODY_RADIUS } from '../../components/town3d/CharacterBodies.js';

export function informationExitRoute(start, waitingPlayer = null, clearance = 95, isClear = () => true) {
    // Shift indoor coordinates for the village pathfinder's nonnegative search grid.
    const shift = p => ({ x: p.x + 500, y: (p.z + 500) * P });
    const legal = (x, y) => {
        x -= 500; const z = y / P - 500;
        if (Math.abs(x) > 340 || z < -258 || z > 320) return false;
        if (waitingPlayer && Math.hypot(x - waitingPlayer.x, z - waitingPlayer.z) < clearance) return false;
        return !INFORMATION_OBSTACLES.some(b => x > b.minX - 26 && x < b.maxX + 26
            && z > b.minZ - 26 && z < b.maxZ + 26) && isClear(x, z);
    };
    return roundTourRoute(tourRoute(shift(start), shift({ x: 0, z: 312 }), legal, { step: 10 }), legal)
        .map(p => ({ x: p.x - 500, y: p.y - 500 * P }));
}
async function walk(route, update, speed = 160) {
    const length = routeLength(route);
    await animate(length / speed, t => {
        // animate supplies smooth start/stop timing; position and facing use the same curve.
        const distance = length * t;
        update(routePoint(route, distance), routePoint(route, Math.min(length, distance + 12)));
    });
}
export async function leaveInformationForBank(scenes) { return quickMoaExit(scenes, 'information', 'settlement_information'); }
