import { PackingGame } from '../components/packing/PackingGame.js';
import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { gameKey } from './GameKeys.js';

export function initPackingGame(app) {
    const stopPlayers = () => {
        app.townStage?.playerController.keysHeld.clear();
        if (app.townStage) app.townStage.playerController.isMoving = false;
        app.vivianStoreModal?.player.stop();
    };
    app.packingGame = new PackingGame({ onOpen: stopPlayers, onClose: stopPlayers });
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'packing-store-button';
    button.textContent = '✿ 포장 알바 하기';
    button.addEventListener('click', () => app.packingGame.open());
    app.vivianStoreModal.modalEl.append(button);
}

export function installPackingEntrance(app) {
    const town = app.townStage;
    const building = TOWN_MODEL_BUILDINGS.find(item => item.id === 'vivian_store');
    const near = () => document.body.classList.contains('ui-paused')
        && !town.containerEl.classList.contains('hidden') && !town.callbacks.isInputBlocked?.()
        && Math.abs(town.playerController.charPosX - building.x) < 90
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 155;
    const hint = document.createElement('button');
    hint.type = 'button'; hint.className = 'packing-entry-hint';
    hint.textContent = 'F · 잡화점 포장 알바'; hint.hidden = true;
    town.viewportEl.append(hint);
    hint.addEventListener('click', () => { if (near()) app.packingGame.open(); });
    window.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || gameKey(event) !== 'f' || !near()) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) app.packingGame.open();
    }, true);
    if (new URLSearchParams(location.search).get('scene') === 'packing') app.packingGame.open();
    return () => { hint.hidden = !near(); };
}
