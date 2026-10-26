import { gameKey, bindingLabel } from './GameKeys.js';
import { GROUND_PROJECTION } from '../data/townModelBuildings.js';

// Present the retained dialogue controller over the current 3D room, without
// reopening its retired 2D lobby or changing quests, practice or account logic.
export function installCipherModelDialogue(scene, lobby) {
    const host = document.createElement('div');
    host.className = 'modal-overlay model-dialogue-overlay hidden';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-label', '토리와 대화');
    scene.layer.parentElement.append(host);
    const hint = document.createElement('button');
    hint.className = 'model-dialogue-hint';
    hint.hidden = true;
    scene.layer.append(hint);
    const near = () => {
        const desk = scene.layout.desk, player = scene.controller;
        return scene.active && Math.abs(player.charPosX - desk.x) < desk.width / 2
            && Math.abs(player.charPosY / GROUND_PROJECTION - (desk.z + desk.depth / 2 + 50)) < 75;
    };
    const opened = () => !host.classList.contains('hidden');
    const close = () => {
        if (!opened()) return;
        lobby.advanceNotice(true);
        host.classList.add('hidden');
        lobby.dialog.append(lobby.notice);
        scene.layer.focus({ preventScroll: true });
    };
    const open = () => {
        if (!near() || scene.blocked()) return;
        scene.controller.keysHeld.clear();
        lobby.player.stop();
        host.append(lobby.notice);
        host.classList.remove('hidden');
        lobby.renderAgentChoices();
        hint.hidden = true;
    };
    hint.onclick = open;
    new MutationObserver(() => {
        if (opened() && lobby.notice.hidden) close();
    }).observe(lobby.notice, { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (opened()) {
            if (event.key === 'Escape') {
                event.preventDefault(); event.stopImmediatePropagation();
                if (!event.repeat) close();
            } else if (!host.contains(event.target)) {
                event.preventDefault(); event.stopImmediatePropagation();
            }
            return;
        }
        if (!near() || scene.blocked() || gameKey(event) !== 'f'
            || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat) open();
    }, true);
    const update = () => {
        if (!scene.active && opened()) close();
        hint.hidden = !near() || scene.blocked();
        hint.textContent = `${bindingLabel('f')} · 토리와 대화하기`;
        requestAnimationFrame(update);
    };
    update();
}
