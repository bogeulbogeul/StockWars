import { createTourPlayerControls } from '../../app/exhibition/TourPlayerControls.js';
import { createMoaWakeDialogue } from '../dialogue/MoaWakeDialogue.js';
import { createMoaMovementGuide } from '../town3d/MoaMovementGuide.js';

// A temporarily occupied aisle must leave the player able to make room,
// rather than rejecting an async activity after its dialogue was hidden.
export async function waitForWorkstationRoute(scene, plan) {
    try { return plan(); } catch { /* Ask for space and retry after movement. */ }
    const dialogue = createMoaWakeDialogue(), guide = createMoaMovementGuide(scene.layer, { follow: true });
    const c = scene.controller, previousGreeting = scene.greetingActive;
    scene.greetingActive = true; c.keysHeld.clear();
    dialogue.showLine('이쪽 통로로 지나가야 해요. 제가 갈 수 있게 조금만 비켜주실래요?',
        { speaker: 'bongbong', name: '봉봉' });
    guide.update({ visible: true, text: 'WASD로 봉봉이가 지나갈 공간을 비워 주세요' });
    const controls = createTourPlayerControls(c); let previous, x = c.charPosX, y = c.charPosY;
    try { return await new Promise(resolve => {
        const tick = now => {
            if (!scene.active) { resolve(null); return; }
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; controls.update(dt);
            if (Math.hypot(c.charPosX - x, c.charPosY - y) >= 4) {
                x = c.charPosX; y = c.charPosY;
                try { resolve(plan()); return; } catch { /* Still occupied. */ }
            }
            requestAnimationFrame(tick);
        }; requestAnimationFrame(tick);
    }); } finally {
        controls.dispose(); dialogue.dispose(); guide.dispose(); scene.greetingActive = previousGreeting;
    }
}
