import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { MathUtils } from '../../../vendor/three/three.module.js';
import { tourRoute, routeLength, routePoint } from './TourRoute.js';
import { roundTourRoute } from './TourCurve.js';

export async function walkPlayerIntoInformation(player, door) {
    const c = player.town.playerController;
    const start = { x: c.charPosX, y: c.charPosY };
    const end = { x: door.center.x, y: (door.center.z - 35) * P };
    const legal = (x, y) => c.sceneryCanStand(x, y)
        || (Math.abs(x - door.center.x) < 44 && y >= end.y - 4 && y <= start.y + 4);
    const route = roundTourRoute(tourRoute(start, end, legal, { step: 12 }), legal);
    const length = routeLength(route);
    c.keysHeld.clear(); c.scriptedWalking = true; c.isMoving = true;
    player.storyYaw = player.storyTarget = player.storyCamera = null;
    let previous, progress = 0;
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; progress = Math.min(length, progress + dt * 145);
                const point = routePoint(route, progress), ahead = routePoint(route, Math.min(length, progress + 18));
                c.charPosX = point.x; c.charPosY = point.y;
                const step = MathUtils.smoothstep((door.center.z + 150 - point.y / P) / 150, 0, 1);
                c.scriptedSupportHeight = Math.max(0, door.floorY) * step;
                const dx = ahead.x - point.x, dy = ahead.y - point.y;
                c.facing = Math.abs(dx) > Math.abs(dy / P) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
                if (progress >= length) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    } finally {
        c.scriptedWalking = false; c.isMoving = false; c.keysHeld.clear();
        delete c.scriptedSupportHeight;
        player.setState('idle');
    }
}
