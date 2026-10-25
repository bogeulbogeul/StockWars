import { createMoaMovementGuide } from '../components/town3d/MoaMovementGuide.js';
import { nextMoaCall, MOA_WAKE_CALLS } from '../data/moaWake.js';

export function installTownMoaWake(app, { inTown, nearMoa }) {
    const controller = app.townStage.playerController;
    let actor, calls = 0, busy = false, wasSleeping = true;
    const guide = createMoaMovementGuide(app.townStage.viewportEl, {
        onInteract: () => { void interact(); },
        onDirection: (key, held) => {
            if (held) { controller.stopResting(); controller.keysHeld.add(key); }
            else controller.keysHeld.delete(key);
        }
    });
    function update() {
        const current = app.townModelScene?.sleepingAnna;
        const sleeping = !!current?.root.userData.sleeping;
        if (current !== actor || (!wasSleeping && sleeping)) { calls = 0; actor = current; }
        wasSleeping = sleeping;
        guide.update({ visible: !!actor && inTown() && !document.body.classList.contains('title-screen-active') && (sleeping || busy),
            near: nearMoa(), count: calls, busy });
    }
    async function interact() {
        update();
        if (!actor || !nearMoa() || busy) return;
        if (!actor.root.userData.sleeping) { app.annaDialogueModal?.show(); return; }
        calls = nextMoaCall(calls, true); actor.root.userData.wakeCalls = calls;
        if (calls < MOA_WAKE_CALLS) { update(); return; }
        busy = true; controller.keysHeld.clear(); controller.isMoving = false;
        update();
        await actor.setAwake(true);
        await actor.standReady;
        busy = false; update();
        if (inTown()) app.annaDialogueModal?.show();
    }
    return { update, interact };
}
