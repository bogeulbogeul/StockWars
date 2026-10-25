import { createMoaWakeDialogue } from '../components/dialogue/MoaWakeDialogue.js';
import { createMoaMovementGuide } from '../components/town3d/MoaMovementGuide.js';
import { nextMoaCall, MOA_WAKE_CALLS } from '../data/moaWake.js';

export function installTownMoaWake(app, { inTown, nearMoa }) {
    const controller = app.townStage.playerController;
    let actor, calls = 0, busy = false, wasSleeping = true;
    const guide = createMoaMovementGuide(app.townStage.viewportEl);
    const dialogue = createMoaWakeDialogue(() => { void interact(); });
    let moved = false, origin;
    function update() {
        const current = app.townModelScene?.sleepingAnna;
        const sleeping = !!current?.root.userData.sleeping;
        if (current !== actor) { calls = 0; actor = current; origin = { x: controller.charPosX, y: controller.charPosY }; }
        if (!wasSleeping && sleeping) calls = 0;
        if (origin && inTown() && !document.body.classList.contains('title-screen-active')
            && Math.hypot(controller.charPosX - origin.x, controller.charPosY - origin.y) > .5) moved = true;
        wasSleeping = sleeping;
        guide.update({ visible: !!actor && inTown() && !document.body.classList.contains('title-screen-active') && sleeping && !moved,
            near: nearMoa() });
        if (!inTown() || !nearMoa()) dialogue.hide();
    }
    async function interact() {
        update();
        if (!actor || !nearMoa() || busy) return;
        if (!actor.root.userData.sleeping) { app.annaDialogueModal?.show(); return; }
        calls = nextMoaCall(calls, true); actor.root.userData.wakeCalls = calls;
        if (calls < MOA_WAKE_CALLS) { update(); dialogue.show(calls); return; }
        dialogue.hide();
        busy = true; controller.keysHeld.clear(); controller.isMoving = false;
        update();
        await actor.setAwake(true);
        await actor.standReady;
        busy = false; update();
        if (inTown()) app.annaDialogueModal?.show();
    }
    return { update, interact };
}
