import { GROUND_PROJECTION as P, TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { createInformationDoor } from './InformationDoor.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { createCharacterBodies } from '../../components/town3d/CharacterBodies.js';
import { walkMoaThroughDoor } from './DoorwayMoaWalk.js';
import { walkPlayerIntoInformation } from './InformationPlayerEntry.js';

export async function enterInformationAfterMoa(scenes) {
    await scenes.ready;
    const room = await scenes.prepareRoom('information');
    const town = scenes.townModelScene, moa = town.sleepingAnna, player = town.player;
    const c = scenes.townStage.playerController;
    const definition = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
    const building = town.scene.getObjectByName(definition.id), door = createInformationDoor(building);
    await moa.setMood('calm', 'smile');
    town.entryActive = true; town.dialogueOcclusion?.reset();
    player.holdFacing(); moa.faceTarget(null);
    await door.open();
    await walkMoaThroughDoor(moa, door, c);
    moa.root.visible = false;
    await room.room.userData.seatMoa();
    room.characterBodies = createCharacterBodies(room.room);
    await door.close();
    town.entryActive = false;
    const guide = createMoaMovementGuide(scenes.townStage.viewportEl, { door: true });
    guide.update({ visible: true }); scenes.tourActive = true;
    let opened = false, previous;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (Math.abs(c.charPosX - door.center.x) < 85 && c.charPosY > definition.y + 10 && c.charPosY < definition.y + 165) opened = true;
    } });
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (opened) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        guide.dispose(); controls.dispose();
        town.entryActive = true; town.dialogueOcclusion?.reset();
        await door.open();
        await walkPlayerIntoInformation(player, door);
        scenes.informationEntered = true;
        void door.close();
    } finally {
        guide.dispose(); controls.dispose(); scenes.tourActive = false;
        town.entryActive = false;
    }
}
