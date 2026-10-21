import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { gameKey } from './GameKeys.js';
import { connectCipherLobbyRooms } from './CipherLobbyRooms.js';

export function installCipherLobbyEntrance(app) {
    const building = TOWN_MODEL_BUILDINGS.find(item => item.id === 'cipher_securities');
    const town = app.townStage;
    const hint = document.createElement('p');
    hint.className = 'cipher-lobby-entry-hint';
    town.viewportEl.append(hint);
    const inTown = () => document.body.classList.contains('town-model-mode')
        && !town.containerEl.classList.contains('hidden') && !town.callbacks.isInputBlocked?.();
    const near = () => Math.abs(town.playerController.charPosX - building.x) < 85
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 145;
    let returnPosition;
    const enter = () => {
        if (!inTown()) return;
        const player = town.playerController;
        returnPosition = { x: player.charPosX, y: player.charPosY };
        player.keysHeld.clear();
        player.isMoving = false;
        const isNew = !app.cipherLobbyScene;
        app.cipherLobbyScene ||= new CipherLobbyScene(app.appContainer, async () => {
            const entered = await app.enterTown();
            if (entered === false) return;
            app.cipherLobbyScene.hide();
            player.charPosX = returnPosition.x;
            player.charPosY = returnPosition.y;
            player.keysHeld.clear();
            player.isMoving = false;
            player.facing = 'down';
            player.updateCamera(town.viewportEl.clientWidth, town.viewportEl.clientHeight, 0, true);
        });
        if (isNew) connectCipherLobbyRooms(app.cipherLobbyScene, app.cipherLobby);
        town.hide();
        document.body.classList.remove('town-mode-active');
        app.cipherLobbyScene.show();
    };
    // Legacy town callbacks must also use the current 3D lobby, never the retired image room.
    app.cipherLobby.open = enter;
    window.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || !inTown()) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        const key = gameKey(event);
        if (key !== 'l' && !(key === 'f' && near())) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) enter();
    }, true);
    if (new URLSearchParams(location.search).get('scene') === 'cipher-lobby') enter();
    return () => {
        hint.hidden = !inTown();
        hint.textContent = near() ? 'F · 증권사 로비 입장' : 'L · 증권사 로비 시점 확인';
    };
}
