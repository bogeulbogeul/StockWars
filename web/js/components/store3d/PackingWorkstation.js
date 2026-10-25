import { Box3 } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { createTourPlayerControls } from '../../app/exhibition/TourPlayerControls.js';
import { createMoaMovementGuide } from '../town3d/MoaMovementGuide.js';
import { introducePackingWorkstation } from './BongbongWorkstationGuide.js';

export function packingWorktopBounds(scene) {
    const mesh = scene.room.getObjectByName('Packing_Worktop');
    if (!mesh) throw new Error('잡화점 포장 작업대를 찾지 못했어요.');
    scene.room.updateMatrixWorld(true); return new Box3().setFromObject(mesh);
}
export function nearPackingWorktop(bounds, x, z) {
    const forward = z - bounds.max.z;
    const side = Math.max(bounds.min.x - x, 0, x - bounds.max.x);
    return forward >= 25 && Math.hypot(side, forward) <= 100;
}
export async function waitForPackingWorkstation(scene) {
    const bounds = packingWorktopBounds(scene), c = scene.controller;
    scene.awaitingPackingWorktop = true;
    try {
        if (!await introducePackingWorkstation(scene, bounds)) { scene.awaitingPackingWorktop = false; return false; }
    } catch (error) { scene.awaitingPackingWorktop = false; throw error; }
    const guide = createMoaMovementGuide(scene.layer, { packingWork: true });
    let requested = false, previous;
    scene.awaitingPackingWorktop = true; c.keysHeld.clear();
    guide.update({ visible: true });
    const controls = createTourPlayerControls(c, { onInteract: () => {
        if (!c.busSeated && nearPackingWorktop(bounds, c.charPosX, c.charPosY / P)) requested = true;
    } });
    const escape = event => {
        if (window.stockWarsExhibition?.started && event.code === 'Escape') {
            event.preventDefault(); event.stopImmediatePropagation();
        }
    };
    window.addEventListener('keydown', escape, true);
    try {
        return await new Promise(resolve => {
            const tick = now => {
                if (!scene.active || !scene.awaitingPackingWorktop) { resolve(false); return; }
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (requested) resolve(true); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    } finally {
        scene.awaitingPackingWorktop = false; guide.dispose(); controls.dispose();
        window.removeEventListener('keydown', escape, true);
    }
}
