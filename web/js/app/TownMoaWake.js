import { stepAsideForMoa } from '../components/town3d/SomangiStepAside.js';
import { faceConversation, clearConversationFacing } from '../components/town3d/ConversationFacing.js';
import { createMoaWakeDialogue } from '../components/dialogue/MoaWakeDialogue.js';
import { createMoaMovementGuide } from '../components/town3d/MoaMovementGuide.js';
import { nextMoaCall, MOA_WAKE_CALLS, outsideMoaApproach } from '../data/moaWake.js';

export function installTownMoaWake(app, { inTown, nearMoa }) {
    const controller = app.townStage.playerController;
    let actor, calls = 0, busy = false, wasSleeping = true;
    const guide = createMoaMovementGuide(app.townStage.viewportEl);
    const dialogue = createMoaWakeDialogue();
    const reminder = createMoaWakeDialogue();
    let warnedOutside = false;
    window.addEventListener('keydown', event => {
        if (!reminder.isOpen || !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'Space'].includes(event.code)) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.code === 'KeyF' && !event.repeat) reminder.hide();
    }, true);
    let moved = false, origin;
    function update() {
        const current = app.townModelScene?.sleepingAnna;
        const sleeping = !!current?.root.userData.sleeping;
        if (current !== actor) { calls = 0; actor = current; origin = { x: controller.charPosX, y: controller.charPosY }; }
        if (!wasSleeping && sleeping) calls = 0;
        if (origin && inTown() && !document.body.classList.contains('title-screen-active')
            && Math.hypot(controller.charPosX - origin.x, controller.charPosY - origin.y) > .5) moved = true;
        const outside = outsideMoaApproach(controller.charPosX, controller.charPosY);
        if (!outside) warnedOutside = false;
        if (actor && sleeping && calls === 0 && inTown() && moved && outside && !warnedOutside) {
            warnedOutside = true; controller.keysHeld.clear(); controller.isMoving = false;
            dialogue.hide(); reminder.showLine('우선 저 아이에게 말을 걸어보자.');
        }
        if (!inTown()) reminder.hide();
        wasSleeping = sleeping;
        guide.update({ visible: !!actor && inTown() && !document.body.classList.contains('title-screen-active') && sleeping && !moved,
            near: nearMoa() });
        const speaking = app.annaDialogueModal?.modalOverlay && !app.annaDialogueModal.modalOverlay.classList.contains('hidden');
        if (!inTown() || (!nearMoa() && !speaking && !busy)) { dialogue.hide(); clearConversationFacing(app.townModelScene?.player, actor); }
    }
    async function interact() {
        update();
        if (!actor || !nearMoa() || busy) return;
        if (dialogue.isOpen) { dialogue.hide(); return; }
        faceConversation(app.townModelScene.player, actor);
        if (!actor.root.userData.sleeping) {
            const modal = app.annaDialogueModal;
            if (modal?.modalOverlay && !modal.modalOverlay.classList.contains('hidden')) modal.hide();
            else modal?.show();
            return;
        }
        calls = nextMoaCall(calls, true); actor.root.userData.wakeCalls = calls;
        if (calls < MOA_WAKE_CALLS) { update(); dialogue.show(calls); return; }
        dialogue.hide();
        busy = true; controller.keysHeld.clear(); controller.isMoving = false;
        update();
        await stepAsideForMoa(app.townModelScene.player, actor);
        await actor.setAwake(true);
        await actor.standReady;
        faceConversation(app.townModelScene.player, actor);
        busy = false;
        if (inTown()) app.annaDialogueModal?.show();
        update();
    }
    window.addEventListener('stockwars-arrival-finished', () => {
        moved = false; origin = { x: controller.charPosX, y: controller.charPosY }; update();
    });
    return { update, interact };
}
