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
    scenes.townModelScene.sleepingAnna.root.visible = false;
}
