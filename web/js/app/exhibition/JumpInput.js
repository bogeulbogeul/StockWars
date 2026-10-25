import { gameKey } from '../GameKeys.js';
import { seatUiBlocked } from '../../components/town3d/SeatControls.js';

// The exhibition owns keyboard capture, so forward jump before its catch-all.
export function routeExhibitionJump(event, app) {
    if (gameKey(event) !== 'space' || !app.started || app.arrival.active) return false;
    if (event.target?.closest?.('input, textarea, select, button, a[href], [contenteditable="true"]') || seatUiBlocked()) return false;
    const scenes = app.scenes;
    if (app.activities.game?.isOpen || (app.busy && !scenes.tourActive)) return false;
    const owner = scenes.tourActive ? scenes.townModelScene : scenes.rooms.get(scenes.place) || scenes.townModelScene;
    const player = owner?.player, controller = owner?.controller || owner?.town?.playerController;
    if (!player || !controller || controller.scriptedWalking || controller.busSeated) return false;
    if (owner.town ? owner.town.containerEl.classList.contains('hidden') : !owner.active) return false;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!event.repeat) player.play('jump', { scripted: true });
    return true;
}
