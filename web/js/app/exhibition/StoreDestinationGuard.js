import { TOWN_MODEL_BUILDINGS } from '../../data/townModelBuildings.js';
import { createMoaWakeDialogue } from '../../components/dialogue/MoaWakeDialogue.js';

export function otherStoreTripEntrance(c, buildings = TOWN_MODEL_BUILDINGS, allowedBuilding = 'vivian_store') {
    return buildings.find(b => b.id !== allowedBuilding
        && Math.abs(c.charPosX - b.x - (b.entranceOffsetX || 0)) < 85
        && c.charPosY >= b.y - 10 && c.charPosY < b.y + 145);
}

export function atStoreEntrance(c, buildings = TOWN_MODEL_BUILDINGS) {
    return otherStoreTripEntrance(c, buildings, null)?.id === 'vivian_store';
}

export function createStoreDestinationGuard(scenes, { allowedBuilding = 'vivian_store', text = '우선 잡화점으로 가보자.' } = {}) {
    const c = scenes.townStage.playerController, dialogue = createMoaWakeDialogue();
    const panel = window.stockWarsExhibition?.view.panel;
    let latched = null, previousHidden;
    const hide = () => {
        dialogue.hide();
        if (panel && previousHidden !== undefined) { panel.hidden = previousHidden; previousHidden = undefined; }
    };
    const show = building => {
        latched = building.id;
        if (panel) { previousHidden ??= panel.hidden; panel.hidden = true; }
        dialogue.showLine(text,
            { speaker: 'somang', name: window.stockWarsExhibition?.state.nickname || '???', onNext: hide });
    };
    return {
        interact() {
            if (dialogue.isOpen) { hide(); return true; }
            const building = otherStoreTripEntrance(c, TOWN_MODEL_BUILDINGS, allowedBuilding);
            if (!building) return false;
            show(building); return true;
        },
        move(dx, dy) {
            const building = otherStoreTripEntrance(c, TOWN_MODEL_BUILDINGS, allowedBuilding);
            if (!building || dy > 0 || Math.abs(dx) > Math.abs(dy)) { latched = null; hide(); return; }
            if (dy < 0 && c.charPosY < building.y + 90 && latched !== building.id) show(building);
        },
        dispose() { hide(); dialogue.dispose(); }
    };
}

export const createMoaDestinationGuard = scenes => createStoreDestinationGuard(scenes,
    { allowedBuilding: null, text: '우선 모아에게 가보자.' });

export const createStockDestinationGuard = scenes => createStoreDestinationGuard(scenes,
    { allowedBuilding: 'cipher_securities', text: '우선 증권사로 가보자.' });
