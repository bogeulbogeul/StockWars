import { createExteriorDoor, EXTERIOR_DOORS } from '../../components/town3d/ExteriorDoors.js';
import { walkMoaThroughDoor } from './DoorwayMoaWalk.js';
import { walkPlayerIntoInformation } from './InformationPlayerEntry.js';

export function createBankDoor(building) {
    return createExteriorDoor(building, EXTERIOR_DOORS.node_finance);
}

export async function enterBankOnFoot(scenes) {
    await scenes.prepareRoom('bank');
    scenes.townModelScene.sleepingAnna.root.visible = false;
}
