import { createInformationDoor } from './InformationDoor.js';
import { walkMoaThroughDoor } from './DoorwayMoaWalk.js';
import { walkPlayerIntoInformation } from './InformationPlayerEntry.js';
import { MoaCharacter } from '../../components/town3d/MoaCharacter.js';

export async function enterHomeAfterMoa(scenes) {
    const room = await scenes.prepareRoom('home');
    if (!room.room.userData.moa) {
        const moa = new MoaCharacter(room.scene, { x: 110, z: -60, rotation: .3 });
        await moa.ready; room.room.userData.moa = moa;
        room.room.userData.update = dt => moa.update(dt);
    }
    const town = scenes.townModelScene, moa = town.sleepingAnna;
    const door = createInformationDoor(town.scene.getObjectByName('home_office_tower'), {
        id: 'home', panelName: 'Home_Arched_Wood_Door', approachDistance: 180, hingeName: 'Home_Door_Brass_Hinge',
        darkFill: part => part.name === 'Home_Door_Round_Window_Glass',
        isPart: part => part.name.startsWith('Home_Door_')
    });
    town.entryActive = true; scenes.tourActive = true; town.dialogueOcclusion?.reset();
    town.player.holdFacing(); moa.faceTarget(null);
    try {
        await door.open();
        await walkMoaThroughDoor(moa, door, scenes.townStage.playerController);
        await walkPlayerIntoInformation(town.player, door);
        void door.close();
    } finally { town.entryActive = false; scenes.tourActive = false; }
}
