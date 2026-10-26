import { INFORMATION_OBSTACLES } from './informationObstacles.js';
import { MOA_INFORMATION_POSITION } from './moaModels.js';

export const INFORMATION_MODEL_URL = new URL('../../assets/office/3d/Information-furnished-room.glb', import.meta.url).href;
export const INFORMATION_ROOM = {
    width: 828, depth: 628, wallHeight: 280,
    spawn: { x: 0, z: 235, facing: 'up' }, exitZ: 316, exitHalfWidth: 30,
    camera: { pitch: 35, fieldOfView: 36, targetY: 95, targetZ: 0,
        fitHeight: 650, framingMargin: 1.12 }
};

export function informationCanStand(x, z) {
    const radius = 18;
    const inRoom = Math.abs(x) <= 376 - radius && z >= -276 + radius && z <= 300 - radius;
    const inExit = Math.abs(x) <= 50 - radius && z >= 260 && z <= 338;
    if (!inRoom && !inExit) return false;
    if (Math.hypot(x - MOA_INFORMATION_POSITION.x, z - MOA_INFORMATION_POSITION.z) < MOA_INFORMATION_POSITION.radius) return false;
    return !INFORMATION_OBSTACLES.some(b => x > b.minX - radius && x < b.maxX + radius
        && z > b.minZ - radius && z < b.maxZ + radius);
}
