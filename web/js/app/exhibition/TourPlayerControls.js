import { moveTownBody } from '../../components/town3d/TownBodyMovement.js';
import { SOMANGI_MOVEMENT } from '../../data/somangiMovement.js';

// Only the guide is scripted. The player follows with ordinary WASD input.
export function createTourPlayerControls(controller, { onInteract } = {}) {
    const held = new Set();
    const directions = { KeyW: [0, -1], KeyA: [-1, 0], KeyS: [0, 1], KeyD: [1, 0] };
    const down = event => {
        if (document.querySelector('dialog[open]')) return;
        if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input, textarea, select')) return;
        if (event.code === 'KeyF') {
            event.preventDefault(); event.stopImmediatePropagation();
            if (!event.repeat) onInteract?.();
            return;
        }
        if (directions[event.code]) {
            event.preventDefault(); event.stopImmediatePropagation(); held.add(event.code);
        }
    };
    const up = event => held.delete(event.code);
    const clear = () => { held.clear(); controller.isMoving = false; };
    const visibility = () => { if (document.hidden) clear(); };
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', visibility);
    return {
        clear,
        update(dt) {
            if (document.hidden || document.querySelector('dialog[open]')) { clear(); return; }
            let dx = 0, dy = 0;
            for (const key of held) { dx += directions[key][0]; dy += directions[key][1]; }
            const length = Math.hypot(dx, dy), x = controller.charPosX, y = controller.charPosY;
            if (length) {
                const step = SOMANGI_MOVEMENT.arrivalWalk * dt / length;
                moveTownBody(controller, dx * step, dy * step);
                controller.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up';
            }
            controller.isMoving = Math.hypot(controller.charPosX - x, controller.charPosY - y) > .001;
        },
        dispose() {
            clear(); controller.keysHeld.clear();
            window.removeEventListener('keydown', down, true);
            window.removeEventListener('keyup', up, true);
            window.removeEventListener('blur', clear);
            document.removeEventListener('visibilitychange', visibility);
        }
    };
}
