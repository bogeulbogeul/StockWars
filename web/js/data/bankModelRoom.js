// Native room unit = 100 game units, matching the adopted Somangi comparison.
export const BANK_MODEL_URL = new URL('../../assets/office/3d/Bank-furnished-room.glb', import.meta.url).href;
export const BANK_MODEL_SCALE = 100;
export const BANK_ROOM = {
    width: 828, depth: 628, wallHeight: 280,
    spawn: { x: 0, z: 235, facing: 'up' }, exitZ: 316, exitHalfWidth: 30,
    camera: { pitch: 35, fieldOfView: 36, targetY: 95, targetZ: 0,
        fitHeight: 650, framingMargin: 1.12 }
};

// Rectangles follow the actual U counter, not its overall bounding box.
export const BANK_OBSTACLES = [
    { id: 'counter', minX: -188, maxX: 188, minZ: -57, maxZ: 12 },
    { id: 'counter-left-return', minX: -188, maxX: -130, minZ: -100, maxZ: -57 },
    { id: 'counter-right-return', minX: 130, maxX: 188, minZ: -100, maxZ: -57 },
    { id: 'chair', minX: -50, maxX: 50, minZ: -172, maxZ: -82 },
    { id: 'sofa', minX: -370, maxX: -269, minZ: -9, maxZ: 219 },
    { id: 'cabinet', minX: -351, maxX: -179, minZ: -273, maxZ: -218 },
    { id: 'safe', minX: 208, maxX: 332, minZ: -279, maxZ: -181 },
    { id: 'plant', minX: -349, maxX: -279, minZ: 221, maxZ: 295 },
    { id: 'terminal', minX: 307, maxX: 358, minZ: 66, maxZ: 127 }
];

export function bankCanStand(x, z) {
    const radius = 22;
    const inRoom = Math.abs(x) <= 376 - radius && z >= -276 + radius && z <= 300 - radius;
    const inExit = Math.abs(x) <= 50 - radius && z >= 260 && z <= 338;
    if (!inRoom && !inExit) return false;
    return !BANK_OBSTACLES.some(b => x > b.minX - radius && x < b.maxX + radius
        && z > b.minZ - radius && z < b.maxZ + radius);
}
