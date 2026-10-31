import { waitForStockExit } from './StockManualExit.js';
import { dismountPlayerSeat } from './PlayerSeatDismount.js';
import { leaveStoryBuilding } from './BuildingTravel.js';
import { waitForDestination } from './DestinationWalk.js';
import { fadeOutMoa } from './MoaFadeOut.js';
import { createStoreDestinationGuard } from './StoreDestinationGuard.js';

// Moa goes ahead; only a door interaction can move the player outdoors.
export async function travelFromInformationToBank(scenes, destination) {
    scenes.bankTripPending = true;
    scenes.bankTripGuard = createStoreDestinationGuard(scenes, {
        allowedBuilding: 'node_finance', text: '우선 은행에 가보자.'
    });
    try {
        const room = scenes.rooms.get('information');
        const bank = await scenes.prepareRoom('bank');
        await bank.room.userData.moaReady;
        bank.room.userData.moa.root.visible = true;
        await fadeOutMoa(room.room.userData.moa.root);
        scenes.townModelScene.sleepingAnna.root.visible = false;
        scenes.bankEntered = true;
        scenes.tourActive = true;
        await dismountPlayerSeat(room);
        room.player.storyYaw = room.player.storyTarget = room.player.storyCamera = null;
        await waitForStockExit(scenes, room, false, {
            title: '모아는 은행에서 기다리고 있어요. 출입문으로 이동해 F로 나가보자'
        });
        await leaveStoryBuilding(scenes);
        await waitForDestination(scenes, destination, '은행', {
            guidanceTitle: '모아가 은행 안에서 기다리고 있어요. 은행 문 앞에서 F로 들어가보자'
        });
        scenes.place = 'bankOutside';
    } catch (error) {
        scenes.bankTripPending = false;
        scenes.bankTripGuard?.dispose(); scenes.bankTripGuard = null;
        throw error;
    } finally { scenes.tourActive = false; }
}
