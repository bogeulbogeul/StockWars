import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { gameKey } from './GameKeys.js';

// The current art-preview town uses model positions instead of the legacy map.
export function installHomeModelEntrance(app) {
    const home = TOWN_MODEL_BUILDINGS.find(building => building.id === 'home_office_tower');
    const hint = document.createElement('p');
    hint.className = 'home-entry-hint';
    hint.textContent = 'F · 집에 들어가기';
    hint.hidden = true;
    app.townStage.viewportEl.append(hint);
    const near = () => {
        const town = app.townStage, player = town.playerController;
        return !town.containerEl.classList.contains('hidden') && !town.callbacks.isInputBlocked?.()
            && Math.abs(player.charPosX - home.x - (home.entranceOffsetX || 0)) < 85
            && player.charPosY >= home.y + 15 && player.charPosY < home.y + 145;
    };
    window.addEventListener('keydown', event => {
        if (!document.body.classList.contains('town-model-mode') || gameKey(event) !== 'f') return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (!near()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat && near()) {
            app.townStage.playerController.keysHeld.clear();
            app.enterOffice();
        }
    }, true);
    return () => { hint.hidden = !near(); };
}
