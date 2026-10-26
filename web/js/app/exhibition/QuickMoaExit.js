import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { quickFade, positionOutside } from '../QuickTravel.js';
export async function quickMoaExit(scenes, place, id) {
    const room = scenes.rooms.get(place), town = scenes.townModelScene, moa = town.sleepingAnna;
    scenes.tourActive = true;
    try { await quickFade(async () => {
        room.seatInteraction?.stand();
        if (room.room.userData.moa) room.room.userData.moa.root.visible = false;
        room.hide(); scenes.townStage.containerEl.classList.remove('hidden');
        positionOutside(town, id);
        await moa.setAwake(true, { immediate: true });
        const c = scenes.townStage.playerController;
        moa.root.position.set(c.charPosX - 100, c.supportHeightAt?.(c.charPosX - 100, c.charPosY) || 0, c.charPosY / P);
        moa.root.visible = true; moa.root.userData.tourWalking = false;
        town.draw(); scenes.place = place + 'Outside';
    }); } finally { scenes.tourActive = false; }
}
