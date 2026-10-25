import { leaveBuildingOnFoot } from '../OnFootNavigation.js';
import { finishToriLesson } from './ToriTrainingLesson.js';
import { waitForStockExit } from './StockManualExit.js';
import { VIVIAN_EXIT_Z, VIVIAN_ROOM_RATIO } from '../../data/vivianModelRoom.js';

export const STORY_BUILDINGS = {
    home: { id: 'home_office_tower', outside: 'homeOutside', label: '집' },
    information: { id: 'settlement_information', outside: 'informationOutside', label: '안내소' },
    bank: { id: 'node_finance', outside: 'bankOutside', label: '은행' },
    store: { id: 'vivian_store', outside: 'storeOutside', label: '잡화점' },
    stock: { id: 'cipher_securities', outside: 'stockOutside', label: '증권사' }
};

export async function leaveStoryBuilding(scenes) {
    const leavingLesson = scenes.place === 'stock' && !!scenes.stockLesson;
    if (leavingLesson) await finishToriLesson(scenes);
    const definition = STORY_BUILDINGS[scenes.place];
    if (!definition) return;
    const room = scenes.rooms.get(scenes.place);
    scenes.tourActive = true;
    try {
        if (scenes.place === 'stock' && !leavingLesson) await waitForStockExit(scenes, room);
        if (scenes.place === 'store') await waitForStockExit(scenes, room, false, {
            layout: { exitZ: VIVIAN_EXIT_Z, exitHalfWidth: 48 * VIVIAN_ROOM_RATIO },
            title: '출입문으로 걸어가 잡화점 밖으로 나가보자'
        });
        await leaveBuildingOnFoot({ room, town: scenes.townModelScene, id: definition.id,
            showTown: () => { room.hide(); scenes.townStage.containerEl.classList.remove('hidden'); } });
        scenes.place = definition.outside;
    } finally { scenes.tourActive = false; }
}
