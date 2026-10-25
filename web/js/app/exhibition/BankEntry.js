import { createExteriorDoor, EXTERIOR_DOORS } from '../../components/town3d/ExteriorDoors.js';
import { walkMoaThroughDoor } from './DoorwayMoaWalk.js';
import { walkPlayerIntoInformation } from './InformationPlayerEntry.js';

export function createBankDoor(building) {
    return createExteriorDoor(building, EXTERIOR_DOORS.node_finance);
}

export async function enterBankOnFoot(scenes) {
    await scenes.prepareRoom('bank');
    const town = scenes.townModelScene, moa = town.sleepingAnna, player = town.player;
    const door = createBankDoor(town.scene.getObjectByName('node_finance'));
    town.entryActive = true; scenes.tourActive = true; town.dialogueOcclusion?.reset();
    player.holdFacing(); moa.faceTarget(null);
    try {
        await door.open();
        await walkMoaThroughDoor(moa, door, scenes.townStage.playerController);
        await walkPlayerIntoInformation(player, door);
        void door.close();
    } finally {
        town.entryActive = false; scenes.tourActive = false;
    }
}
