import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { doorwayRoute, doorwayHeight } from './DoorwayTraversal.js';
import { routeLength, routePoint } from './TourRoute.js';

export async function walkPlayerIntoInformation(player, door, { stopBeforeDoor } = {}) {
    const c = player.town.playerController;
    const start = { x: c.charPosX, y: c.charPosY };
    const route = doorwayRoute(start, door, (x, y) => c.sceneryCanStand(x, y));
    if (stopBeforeDoor !== undefined) route.at(-1).y = (door.center.z + stopBeforeDoor) * P;
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
                c.isMoving = true;
                c.scriptedSupportHeight = doorwayHeight(door, point.y / P);
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
