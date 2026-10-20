import { TOWN_ARRIVAL } from '../data/townLandscapeLayout.js';

// A reversible art-review state: no new game, registration, or save reset.
export function startTownPreview(app) {
    if (!document.body.classList.contains('ui-paused')) return;
    app.officeStage.hide();
    app.townStage.show({ name: '그래픽 확인', ping: null });
    // Arrive in the open lane between the foreground stop and information office.
    // This art-preview position does not write to the player's save.
    app.townStage.playerController.charPosX = TOWN_ARRIVAL.x;
    app.townStage.playerController.charPosY = TOWN_ARRIVAL.y;
    app.townStage.playerController.updateCamera(app.townStage.viewportEl.clientWidth,
        app.townStage.viewportEl.clientHeight, 0, true);
    document.body.classList.add('town-mode-active');
    document.activeElement?.blur();

    // Hidden UI must not receive focus or open an invisible modal via shortcuts.
    const allowed = new Set(['w', 'a', 's', 'd', 'f', 'l', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'shift', '1', '2', 'escape', ' ']);
    const physicalKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyL', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Space']);
    window.addEventListener('keydown', event => {
        if (!document.body.classList.contains('ui-paused')) return;
        if (document.body.classList.contains('cipher-facility-active') && event.target?.closest?.('dialog[open]')) return;
        if (app.homeModelScene?.active && ['KeyQ', 'KeyE'].includes(event.code)) return;
        if (app.cipherLobbyScene?.simulationRoomScene?.active && event.code==='Enter') return;
        if (allowed.has(event.key.toLowerCase()) || physicalKeys.has(event.code) || event.key === 'F5' || event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
    app.townStage.viewportEl.addEventListener('click', event => {
        if (!document.body.classList.contains('ui-paused')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
}
