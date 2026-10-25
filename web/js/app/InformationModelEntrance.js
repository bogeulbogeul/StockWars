import { faceConversation } from '../components/town3d/ConversationFacing.js';
import { installTownMoaWake } from './TownMoaWake.js';
import { GROUND_PROJECTION } from '../data/townModelBuildings.js';
import { TOWN_MODEL_BUILDINGS } from '../data/townModelBuildings.js';
import { INFORMATION_ROOM, informationCanStand } from '../data/informationModelRoom.js';
import { CipherLobbyScene } from '../components/cipher3d/CipherLobbyScene.js';
import { buildInformationModelRoom } from '../components/information3d/InformationModelRoom.js';
import { gameKey } from './GameKeys.js';
import { MOA_INFORMATION_POSITION, MOA_TOWN_POSITION } from '../data/moaModels.js';

export function installInformationModelEntrance(app) {
    const building = TOWN_MODEL_BUILDINGS.find(b => b.id === 'settlement_information');
    const town = app.townStage;
    const hint = document.createElement('p');
    hint.className = 'home-entry-hint';
    hint.textContent = 'F · 모아 안내소 입장';
    hint.hidden = true;
    town.viewportEl.append(hint);
    const inTown = () => !town.containerEl.classList.contains('hidden')
        && !town.callbacks.isInputBlocked?.();
    const nearMoa = () => {
        const actor = app.townModelScene?.sleepingAnna?.root.position;
        return inTown() && Math.hypot(town.playerController.charPosX - (actor?.x ?? MOA_TOWN_POSITION.x),
            town.playerController.charPosY - (actor ? actor.z * GROUND_PROJECTION : MOA_TOWN_POSITION.y)) < 100;
    };
    const wake = installTownMoaWake(app, { inTown, nearMoa });
    const near = () => (document.body.classList.contains('town-model-mode')
        || document.body.classList.contains('ui-paused')) && inTown()
        && Math.abs(town.playerController.charPosX - building.x) < 85
        && town.playerController.charPosY >= building.y + 15
        && town.playerController.charPosY < building.y + 145;
    app.enterInformationModel = () => {
        if (!inTown()) return;
        const player = town.playerController;
        player.keysHeld.clear();
        player.isMoving = false;
        app.informationModelScene ||= new CipherLobbyScene(app.appContainer, async () => {
            const entered = await app.enterTown(null, 'settlement_information');
            if (entered === false) return;
            player.charPosX = building.x;
            player.charPosY = building.y + 85;
            player.keysHeld.clear();
            player.isMoving = false;
            player.facing = 'down';
            player.updateCamera(town.viewportEl.clientWidth, town.viewportEl.clientHeight, 0, true);
        }, {
            layout: INFORMATION_ROOM, buildRoom: buildInformationModelRoom,
            canStand: informationCanStand,
            nearbyDoor: (x, z) => Math.hypot(x - MOA_INFORMATION_POSITION.x, z - MOA_INFORMATION_POSITION.z) < 105
                ? { id: 'moa', label: '모아', hint: 'F · 모아와 이야기' } : null,
            onDoorEnter: () => { const scene = app.informationModelScene; faceConversation(scene.player, scene.room.userData.moa); void scene.room.userData.moa.setMood('happy'); app.annaDialogueModal?.show(); },
            stageId: 'informationModelStage', label: '모아 안내소',
            hint: 'WASD 이동 · Shift 달리기 · 아래 출입구 / Esc 마을'
        });
        app.informationModelScene.ready.then(() => app.informationModelScene.renderer?.domElement
            .setAttribute('aria-label', '모아 안내소 3D 화면'));
        for (const key of ['homeModelScene', 'bankModelScene', 'vivianModelScene', 'cipherLobbyScene']) app[key]?.hide();
        town.hide();
        app.officeStage?.hide?.();
        document.body.classList.remove('town-mode-active');
        app.informationModelScene.show();
    };
    town.callbacks.onOpenInformation = app.enterInformationModel;
    window.addEventListener('keydown', event => {
        if (gameKey(event) !== 'f' || (!near() && !nearMoa()) || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) {
            if (nearMoa()) { void wake.interact(); }
            else app.enterInformationModel();
        }
    }, true);
    return () => {
        wake.update();
        const moa = nearMoa(); hint.hidden = !moa && !near();
        hint.textContent = moa ? 'F · 모아와 이야기' : 'F · 모아 안내소 입장';
    };
}
