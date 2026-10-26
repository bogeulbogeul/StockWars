import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export function nearBankCounter(x, z) {
    return z >= 42 && Math.hypot(x, z - 80) <= 120;
}
export async function waitForBankTalk(scenes) {
    const room = scenes.rooms.get('bank'), c = room.controller;
    const guide = createMoaMovementGuide(room.layer, { bankTalk: true });
    guide.update({ visible: true });
    let requested = false, previous;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (room.active && !c.busSeated && nearBankCounter(c.charPosX, c.charPosY / P)) requested = true;
    } });
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (requested) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        scenes.bankAwaitingTalk = false;
    } finally { guide.dispose(); controls.dispose(); }
}
