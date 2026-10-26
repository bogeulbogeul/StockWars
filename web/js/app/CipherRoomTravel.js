import { quickFade } from './QuickTravel.js';
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
    from.doorTravelActive = to.doorTravelActive = true;
    try {
        await to.ready;
        await quickFade(async () => {
            from.hide(); to.show();
            const c = to.controller;
            c.charPosX = -side * (to.layout.width / 2 - 100); c.charPosY = -100 * P;
            c.keysHeld.clear(); c.facing = side > 0 ? 'right' : 'left';
            to.player.update(0); to.player.setState('idle');
        });
    } finally {
        from.controller.scriptedWalking = false; from.controller.isMoving = false;
        to.controller.scriptedWalking = false; to.controller.isMoving = false;
        from.doorTravelActive = to.doorTravelActive = false;
    }
}
