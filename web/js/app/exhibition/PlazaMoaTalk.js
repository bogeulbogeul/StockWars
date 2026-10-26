import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { createMoaDestinationGuard } from './StoreDestinationGuard.js';
import { standPlazaMoa } from './PlazaMoaStand.js';

export async function waitForPlazaMoaTalk(scenes, { stand = false } = {}) {
    const c = scenes.townStage.playerController, moa = scenes.townModelScene.sleepingAnna;
    const guide = createMoaMovementGuide(scenes.townStage.viewportEl, { moaTalk: true });
    guide.update({ visible: true });
    let requested = false, previous;
    scenes.plazaAwaitingTalk = true;
    const guard = createMoaDestinationGuard(scenes);
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (guard.interact()) return;
        if (scenes.moaRestingAtPlaza && Math.hypot(c.charPosX - moa.root.position.x,
            c.charPosY / P - moa.root.position.z) <= 155) requested = true;
    }, onMoveAttempt: (dx, dy) => guard.move(dx, dy) });
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (requested) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    } finally {
        controls.dispose(); guard.dispose(); guide.dispose();
        scenes.plazaAwaitingTalk = false; scenes.plazaReturnPending = false;
    }
    if (stand) await standPlazaMoa(scenes);
}
