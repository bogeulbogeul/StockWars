import { createCharacterBodies } from '../../components/town3d/CharacterBodies.js';
export async function enterInformationAfterMoa(scenes) {
    const room = await scenes.prepareRoom('information');
    scenes.townModelScene.sleepingAnna.root.visible = false;
    await room.room.userData.seatMoa();
    room.characterBodies = createCharacterBodies(room.room);
    scenes.informationEntered = true;
}
