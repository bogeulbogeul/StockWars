import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { BANK_ROOM, bankCanStand } from '../data/bankModelRoom.js';
import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildBankModelRoom } from '../components/bank3d/BankModelRoom.js';
import { gameKey } from './GameKeys.js';
import { enterBuildingOnFoot, leaveBuildingOnFoot } from './OnFootNavigation.js';

export function installBankModelEntrance(app) {
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === 'node_finance');
    const town = app.townStage;
    const hint = document.createElement('p');
    hint.className = 'home-entry-hint bank-entry-hint';
    hint.textContent = 'F · 차곡 은행 입장';
    hint.hidden = true;
    town.viewportEl.append(hint);
    const inTown = () => !town.containerEl.classList.contains('hidden')
        && !town.callbacks.isInputBlocked?.();
    const near = () => document.body.classList.contains('town-model-mode') && inTown()
        && Math.abs(town.playerController.charPosX - building.x) < 85
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 145;
    let entering = false;
    app.enterBankModel = async () => {
        if (entering || !near()) return;
        entering = true;
        try {
        const player = town.playerController;
        player.keysHeld.clear();
        player.isMoving = false;
        app.bankModelScene ||= new CipherLobbyScene(app.appContainer, async () => {
            await leaveBuildingOnFoot({ room: app.bankModelScene, town: app.townModelScene,
                id: building.id, showTown: () => app.enterTown(null, building.id, { fromDoor: true }) });
        }, {
            layout: BANK_ROOM, buildRoom: buildBankModelRoom, canStand: bankCanStand,
            nearbyDoor: () => null, stageId: 'bankModelStage', label: '차곡 은행',
            hint: 'WASD 이동 · Shift 달리기 · 아래 출입구 / Esc 마을'
        });
        app.bankModelScene.ready.then(() => app.bankModelScene.renderer?.domElement
            .setAttribute('aria-label', '차곡 은행 3D 화면'));
        await app.bankModelScene.ready;
        await enterBuildingOnFoot(app.townModelScene, building.id);
        app.homeModelScene?.hide();
        app.vivianModelScene?.hide();
        app.cipherLobbyScene?.hide();
        town.hide();
        app.officeStage?.hide?.();
        document.body.classList.remove('town-mode-active');
        app.bankModelScene.show();
        } finally { entering = false; }
    };
    town.callbacks.onOpenBank = app.enterBankModel;
    window.addEventListener('keydown', event => {
        if (gameKey(event) !== 'f' || !near() || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) app.enterBankModel();
    }, true);
    if (new URLSearchParams(location.search).get('scene') === 'bank') app.enterBankModel();
    return () => { hint.hidden = !near(); };
}
