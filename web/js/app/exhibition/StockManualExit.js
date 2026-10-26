import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export function atStockExit(room, passage, layout = room.layout) {
    const c = room.controller, z = c.charPosY / P;
    return passage ? c.charPosX >= layout.width / 2 - 100 && Math.abs(z + 100) <= 70
        : Math.abs(c.charPosX) <= layout.exitHalfWidth + 35 && z >= layout.exitZ - 85;
}

export async function waitForStockExit(scenes, room, passage = false, { layout = room.layout, title } = {}) {
    const guide = createMoaMovementGuide(room.layer, { door: true });
    guide.update({ visible: true, text: title || (passage ? '오른쪽 문으로 걸어가 로비로 나가보자' : '출입문으로 걸어가 증권사 밖으로 나가보자') });
    const pending = room.exitPending; room.exitPending = true;
    scenes.stockExitAwaiting = room; scenes.tourActive = true;
    room.player.holdFacing();
    let requested = false, previous;
    const controls = createTourPlayerControls(room.controller, { onInteract: () => {
        if (room.active && !room.controller.busSeated && atStockExit(room, passage, layout)) requested = true;
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
    } finally {
        controls.dispose(); guide.dispose(); room.exitPending = pending; scenes.stockExitAwaiting = null;
    }
}
