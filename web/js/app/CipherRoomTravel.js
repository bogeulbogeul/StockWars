import { GROUND_PROJECTION as P } from '../data/townModelBuildings.js';
import { walkRoomTo } from './OnFootNavigation.js';
import { createExteriorDoor } from '../components/town3d/ExteriorDoors.js';

export function passageDoor(scene, side) {
    const root = scene.room.getObjectByName(side < 0 ? 'door-training' : 'door-competition')
        || scene.room.getObjectByName('training-lobby-return-door') || scene.room.getObjectByName('simulation-lobby-return-door');
    return createExteriorDoor(root, { id: 'passage',
        leaves: ['Door_Leaf_', 'door-training-panel', 'door-competition-panel'],
        parts: /^Door_(Inset|Ivory_Handle)/ });
}
const passageLegal = (scene, side) => (x, z) => scene.canStand(x, z)
    || (Math.abs(z + 100) <= 12 && x * side >= 380 && x * side <= scene.layout.width / 2 - scene.layout.radius);

export async function walkBetweenCipherRooms(from, to, side) {
    if (from.doorTravelActive || to.doorTravelActive) return;
    from.doorTravelActive = true; to.doorTravelActive = true;
    try {
        await to.ready;
        const departureDoor = passageDoor(from, side), arrivalDoor = passageDoor(to, -side);
        await departureDoor.open();
        const edge = from.layout.width / 2 - from.layout.radius;
        await walkRoomTo(from, { x: side * edge, z: -100 }, passageLegal(from, side));
        from.controller.scriptedWalking = true; from.controller.isMoving = false;
        await arrivalDoor.open();
        from.hide(); to.show();
        const c = to.controller, destination = { x: -side * (to.layout.width / 2 - 70), z: -100 };
        c.charPosX = -side * (to.layout.width / 2 - to.layout.radius); c.charPosY = -100 * P;
        c.facing = side > 0 ? 'right' : 'left'; c.scriptedWalking = true; to.player.update(0);
        await walkRoomTo(to, destination, passageLegal(to, -side));
        await Promise.all([departureDoor.close(), arrivalDoor.close()]);
    } finally {
        from.controller.scriptedWalking = false; from.controller.isMoving = false;
        to.controller.scriptedWalking = false; to.controller.isMoving = false;
        from.doorTravelActive = false; to.doorTravelActive = false;
    }
}
