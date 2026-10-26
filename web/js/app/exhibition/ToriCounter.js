import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from './TourPlayerControls.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { Box3, Vector3 } from '../../../vendor/three/three.module.js';

export function nearToriCounter(room, x, z) {
    const desk = room.room.getObjectByName('cipher-cozy-desk');
    if (desk) {
        const bounds = new Box3().setFromObject(desk);
        if (x >= bounds.min.x - 75 && x <= bounds.max.x + 75
            && z >= bounds.max.z - 15 && z <= bounds.max.z + 155) return true;
    }
    const tori = room.room.getObjectByName('tori-character');
    const target = tori?.getWorldPosition(new Vector3());
    return !!target && Math.hypot(x - target.x, z - target.z) <= 180;
}

export async function waitForToriCounter(scenes) {
    const room = scenes.rooms.get('stock'), c = room.controller;
    const guide = createMoaMovementGuide(room.layer, { stockCounter: true }); guide.update({ visible: true });
    let requested = false, previous;
    scenes.tourActive = true; scenes.stockAwaitingTalk = true;
    const controls = createTourPlayerControls(c, { onInteract: () => {
        const z = c.charPosY / P;
        if (room.active && !c.busSeated && nearToriCounter(room, c.charPosX, z)) requested = true;
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
    } finally { controls.dispose(); guide.dispose(); scenes.tourActive = false; scenes.stockAwaitingTalk = false; }
}
