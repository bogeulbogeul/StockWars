import { setInteractionGuidance } from '../components/town3d/GuidanceCard.js';
import { VillageBoard } from '../components/VillageBoard.js?v=readable-v7';
import { TOWN_MODEL_PROPS } from '../data/townModelProps.js';

export function installVillageBoard(app, { canInteract, onRead, onOpen, host } = {}) {
    const town = app.townStage, c = town.playerController;
    const board = new VillageBoard({ onOpen: () => { c.keysHeld.clear(); c.isMoving = false; onOpen?.(); } });
    app.villageBoard = board;
    const prop = TOWN_MODEL_PROPS.find(item => item.id === 'plaza_notice_board');
    const button = document.createElement('button'); button.className = 'board-launch'; button.hidden = true;
    setInteractionGuidance(button, 'F', '게시판 살펴보기'); (host || town.viewportEl).append(button);
    const available = () => !town.containerEl.classList.contains('hidden') && (canInteract ? canInteract() : !town.callbacks.isInputBlocked?.())
        && !document.body.classList.contains('title-screen-active')
        && !document.querySelector('dialog[open],.modal-overlay:not(.hidden)')
        && Math.hypot(c.charPosX - prop.x, c.charPosY - (prop.y + 55)) < 125;
    const open = () => { if (available()) board.open({ onRead: onRead?.() || null }); };
    button.onclick = open;
    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.ctrlKey || event.altKey || event.metaKey
            || event.target.closest?.('input,textarea,select,button,[contenteditable]') || event.code !== 'KeyF' || !available()) return;
        event.preventDefault(); event.stopImmediatePropagation(); open();
    }, true);
    const update = () => { button.hidden = !available(); };
    update.interact = open;
    return update;
}
