import { quickMoaExit } from './QuickMoaExit.js';
import { MathUtils } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { bankCanStand } from '../../data/bankModelRoom.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';
import { animate } from './HandoffMotion.js';
import { createBankDoor } from './BankEntry.js';
import { doorwayHeight } from './DoorwayTraversal.js';

export function bankExitRoute(start, player) {
    const shift = p => ({ x: p.x + 500, y: (p.z + 500) * P });
    const initialGap = player ? Math.hypot(start.x - player.x, start.z - player.z) : 0;
    const legal = (x, y) => {
        x -= 500; const z = y / P - 500;
        return bankCanStand(x, z) && (!player || Math.hypot(x - player.x, z - player.z) >= Math.min(95, initialGap) - .1);
    };
    return roundTourRoute(tourRoute(shift(start), shift({ x: 0, z: 312 }), legal, { step: 10 }), legal)
        .map(p => ({ x: p.x - 500, y: p.y - 500 * P }));
}
async function walk(route, update) {
    const length = routeLength(route);
    await animate(length / 160, t => {
        const d = length * t; update(routePoint(route, d), routePoint(route, Math.min(length, d + 12)));
    });
}
export async function leaveBankAfterMoa(scenes) { return quickMoaExit(scenes, 'bank', 'node_finance'); }
