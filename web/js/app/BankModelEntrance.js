import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { BANK_ROOM, bankCanStand } from '../data/bankModelRoom.js';
import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildBankModelRoom } from '../components/bank3d/BankModelRoom.js';
import { gameKey } from './GameKeys.js';

export function installBankModelEntrance(app) {
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === 'node_finance');
    const town = app.townStage;
    const hint = document.createElement('p');
    hint.className = 'home-entry-hint bank-entry-hint';
    hint.textContent = 'F · 노드 은행 입장';
    hint.hidden = true;
    town.viewportEl.append(hint);
    const inTown = () => !town.containerEl.classList.contains('hidden')
        && !town.callbacks.isInputBlocked?.();
    const near = () => document.body.classList.contains('town-model-mode') && inTown()
        && Math.abs(town.playerController.charPosX - building.x) < 85
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 145;
    app.enterBankModel = () => {
        if (!inTown()) return;
        const player = town.playerController;
        player.keysHeld.clear();
        player.isMoving = false;
        app.bankModelScene ||= new CipherLobbyScene(app.appContainer, async () => {
            const entered = await app.enterTown(null, 'node_finance');
            if (entered === false) return;
            player.charPosX = building.x;
            player.charPosY = building.y + 85;
            player.keysHeld.clear();
            player.isMoving = false;
            player.facing = 'down';
            player.updateCamera(town.viewportEl.clientWidth, town.viewportEl.clientHeight, 0, true);
        }, {
            layout: BANK_ROOM, buildRoom: buildBankModelRoom, canStand: bankCanStand,
            nearbyDoor: () => null, stageId: 'bankModelStage', label: '노드 은행',
            hint: 'WASD / 방향키 이동 · Shift 달리기 · 아래 출입구 / Esc 마을'
        });
        app.bankModelScene.ready.then(() => app.bankModelScene.renderer?.domElement
            .setAttribute('aria-label', '노드 은행 3D 화면'));
        app.homeModelScene?.hide();
        app.vivianModelScene?.hide();
        app.cipherLobbyScene?.hide();
        town.hide();
        app.officeStage?.hide?.();
        document.body.classList.remove('town-mode-active');
        app.bankModelScene.show();
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
