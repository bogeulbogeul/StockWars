import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { routeLength, routePoint } from './TourRoute.js';
import { doorwayRoute, doorwayHeight } from './DoorwayTraversal.js';

export async function walkMoaThroughDoor(moa, door, controller) {
    const start = { x: moa.root.position.x, y: moa.root.position.z * P };
    const clearance = 42 + (moa.root.userData.rigidBody?.radius || 42) + 8;
    const initialGap = Math.hypot(start.x - controller.charPosX, start.y / P - controller.charPosY / P);
    const legal = (x, y) => Math.hypot(x - controller.charPosX, (y - controller.charPosY) / P) >= Math.min(clearance, initialGap)
        && controller.sceneryCanStand(x, y);
    const route = doorwayRoute(start, door, legal), length = routeLength(route);
    const clip = moa.animations.find(clip => clip.name.startsWith('Walk_InPlace'));
    const action = moa.mixer.clipAction(clip); action.reset().play();
    let previous, progress = 0;
    await new Promise(resolve => {
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now;
            progress = Math.min(length, progress + dt * 160);
            const point = routePoint(route, progress), ahead = routePoint(route, Math.min(length, progress + 20));
            const dx = ahead.x - point.x, dz = (ahead.y - point.y) / P;
            moa.root.position.x = point.x; moa.root.position.z = point.y / P;
            moa.root.position.y = doorwayHeight(door, point.y / P);
            if (progress < length) {
                const yaw = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(yaw - moa.root.rotation.y), Math.cos(yaw - moa.root.rotation.y));
                moa.root.rotation.y += Math.max(-4 * dt, Math.min(4 * dt, delta));
            }
            if (progress >= length) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    moa.root.visible = false; action.stop();
}

