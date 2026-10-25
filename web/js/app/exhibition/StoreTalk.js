import { nearBongbong } from '../../components/store3d/BongbongTalk.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { createTourPlayerControls } from './TourPlayerControls.js';

export async function waitForStoreTalk(scenes) {
    const room = scenes.rooms.get('store');
    const guide = createMoaMovementGuide(room.layer, { storeTalk: true }); guide.update({ visible: true });
    let requested = false, previous;
    const controls = createTourPlayerControls(room.controller, { onInteract: () => {
        if (room.active && nearBongbong(room)) requested = true;
    } });
    const escape = event => { if (event.code === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); } };
    window.addEventListener('keydown', escape, true);
    try {
        await new Promise(resolve => {
            const tick = now => {
                const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now; controls.update(dt);
                if (requested) resolve(); else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        scenes.storeAwaitingTalk = false;
    } finally { guide.dispose(); controls.dispose(); window.removeEventListener('keydown', escape, true); }
}
