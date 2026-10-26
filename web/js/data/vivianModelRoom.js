export const VIVIAN_MODEL_URL = new URL('../../assets/interiors/vivian-3d/Vivian-room.glb', import.meta.url).href;
export const VIVIAN_MODEL_SCALE = 75;
export const VIVIAN_ROOM_RATIO = VIVIAN_MODEL_SCALE / 100;
export const VIVIAN_ROOM_BOUNDS = { floorY: .025 };
export const VIVIAN_SPAWN = { x: 0, z: 245 * VIVIAN_ROOM_RATIO };
export const VIVIAN_EXIT_Z = 350 * VIVIAN_ROOM_RATIO;
export const BONGBONG_POSITION = Object.freeze({ x: 0, z: -157.5, radius: 28 });

// Blender +Y becomes Three -Z. Bounds include player radius in world units.
export const VIVIAN_OBSTACLES = [
    { name: '계산대', minX: -144, maxX: 144, minZ: -126, maxZ: -24 },
    { name: '포장대', minX: 90, maxX: 300, minZ: -268, maxZ: -176 },
    { name: '진열대', minX: -395, maxX: -325, minZ: -183, maxZ: 233 },
    { name: '냉장고 뒤', minX: 298, maxX: 398, minZ: -104, maxZ: 44 },
    { name: '냉장고 앞', minX: 298, maxX: 398, minZ: 71, maxZ: 219 }
].map(b => ({ ...b, minX: b.minX * VIVIAN_ROOM_RATIO, maxX: b.maxX * VIVIAN_ROOM_RATIO,
    minZ: b.minZ * VIVIAN_ROOM_RATIO, maxZ: b.maxZ * VIVIAN_ROOM_RATIO }));

export function vivianCanStand(x, z) {
    const r = 20;
    const s = VIVIAN_ROOM_RATIO;
    const room = x >= -400 * s + r && x <= 400 * s - r
        && z >= -300 * s + r && z <= 300 * s - r;
    const exit = Math.abs(x) <= 48 * s - r && z >= 300 * s - r - 5
        && z <= 410 * s - r;
    if (!room && !exit) return false;
    if (Math.hypot(x - BONGBONG_POSITION.x, z - BONGBONG_POSITION.z) < BONGBONG_POSITION.radius + r) return false;
    return !VIVIAN_OBSTACLES.some(b => x > b.minX - r && x < b.maxX + r
        && z > b.minZ - r && z < b.maxZ + r);
}
