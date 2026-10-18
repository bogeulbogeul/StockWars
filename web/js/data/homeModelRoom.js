// Adopted room coordinates, scaled uniformly to the existing 3D player's units.
export const HOME_MODEL_URL = new URL('../../assets/office/3d/Room-cement-entry-full.glb', import.meta.url).href;
// Compact starter room: 65% of the initial shell; Somangi remains 100 units tall.
export const HOME_MODEL_SCALE = 260;
export const HOME_ROOM_BOUNDS = { minX: -0.9507060051, maxX: 0.9497078657,
    minZ: -0.9506528974, maxZ: 0.9496756196, floorY: -0.3631408682,
    wallThickness: 0.071, doorLeft: -0.162, doorRight: 0.209, entryDepth: 0.38 };

export function homeCanStand(x, z) {
    const b = HOME_ROOM_BOUNDS, s = HOME_MODEL_SCALE, radius = 20;
    const minZ = (b.minZ + b.wallThickness) * s + radius;
    const inRoom = x >= (b.minX + b.wallThickness) * s + radius
        && x <= (b.maxX - b.wallThickness) * s - radius
        && z >= minZ && z <= b.maxZ * s - radius;
    const inEntrance = x >= b.doorLeft * s + radius && x <= b.doorRight * s - radius
        && z >= minZ && z <= (b.maxZ + b.entryDepth) * s - radius;
    return inRoom || inEntrance;
}

export const HOME_SPAWN = {
    x: (HOME_ROOM_BOUNDS.doorLeft + HOME_ROOM_BOUNDS.doorRight) / 2 * HOME_MODEL_SCALE,
    z: 0.725 * HOME_MODEL_SCALE
};
export const HOME_EXIT_Z = (HOME_ROOM_BOUNDS.maxZ + HOME_ROOM_BOUNDS.entryDepth) * HOME_MODEL_SCALE - 32;
