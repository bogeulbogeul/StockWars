import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { VivianModelScene } from '../components/store3d/VivianModelScene.js';
import { gameKey } from './GameKeys.js';
import { openVivianCounterShop } from './VivianCounterShop.js';
import { enterStoreDoorOnFoot } from './StoreDoorEntry.js';
import { leaveBuildingOnFoot } from './OnFootNavigation.js';

export function installVivianModelEntrance(app) {
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === 'vivian_store');
    const town = app.townStage;
    let entering = false;
    const wasBlocked = town.callbacks.isInputBlocked;
    town.callbacks.isInputBlocked = () => entering || wasBlocked?.();
    const hint = document.createElement('p');
    hint.className = 'home-entry-hint';
    hint.textContent = 'F · 봉봉 잡화점 입장';
    hint.hidden = true;
    town.viewportEl.append(hint);
    const near = () => document.body.classList.contains('town-model-mode')
        && !town.containerEl.classList.contains('hidden') && !town.callbacks.isInputBlocked?.()
        && Math.abs(town.playerController.charPosX - building.x) < 85
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 145;
    app.enterVivianModel = async () => {
        if (entering || !near()) return;
        entering = true;
        try {
        const player = town.playerController;
        player.keysHeld.clear();
        player.isMoving = false;
        app.vivianModelScene ||= new VivianModelScene(app.appContainer, async () => {
            await leaveBuildingOnFoot({ room: app.vivianModelScene, town: app.townModelScene,
                id: building.id, showTown: () => app.enterTown(null, building.id, { fromDoor: true }) });
        }, () => openVivianCounterShop(app), { onWork: () => app.packingGame?.open() });
        await app.vivianModelScene.ready;
        await enterStoreDoorOnFoot(app.townModelScene);
        app.homeModelScene?.hide();
        app.cipherLobbyScene?.hide();
        town.hide();
        app.officeStage?.hide?.();
        document.body.classList.remove('town-mode-active');
        app.vivianModelScene.show();
        } finally { entering = false; }
    };
    window.addEventListener('keydown', event => {
        if (gameKey(event) !== 'f' || !near() || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) app.enterVivianModel();
    }, true);
    return () => { hint.hidden = !near(); };
}
