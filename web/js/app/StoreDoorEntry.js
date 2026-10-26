import { createInformationDoor } from './exhibition/InformationDoor.js';
import { walkPlayerIntoInformation } from './exhibition/InformationPlayerEntry.js';
import { animate, arms, reach } from './exhibition/HandoffMotion.js';

export async function enterStoreDoorOnFoot(town) {
    await town.ready;
    const player = town.player;
    await player.ready;
    const door = createInformationDoor(town.scene.getObjectByName('vivian_store'), {
        id: 'store', panelName: 'Central_Arched_Wood_Door', approachDistance: 180,
        isPart: part => part.name.startsWith('Door_') && part.name !== 'Door_Continuous_Arch_Frame',
        darkFill: part => part.name === 'Door_Glass'
    });
    town.entryActive = true; town.dialogueOcclusion?.reset();
    const hands = arms(player.variants.get('walk').model);
    try {
        town.storeEntryPhase = 'approaching';
        await walkPlayerIntoInformation(player, door, { stopBeforeDoor: 55 });
        player.town.playerController.scriptedWalking = true; player.town.playerController.isMoving = false;
        town.storeEntryPhase = 'opening';
        await Promise.all([door.open(), animate(.55, t => reach(hands, .65 * Math.sin(Math.PI * t)))]);
        reach(hands, 0);
        town.storeEntryPhase = 'entering';
        await walkPlayerIntoInformation(player, door);
        town.storeEntryPhase = 'complete';
        void door.close();
    } finally {
        reach(hands, 0); town.entryActive = false;
        player.town.playerController.scriptedWalking = false; player.town.playerController.isMoving = false;
    }
}
