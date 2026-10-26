import { Vector3, Quaternion } from '../../../vendor/three/three.module.js';
export function animate(seconds, update, signal) {
    return new Promise((resolve, reject) => {
        let previous, elapsed = 0, frame, finished = false;
        const cleanup = () => { cancelAnimationFrame(frame); signal?.removeEventListener('abort', skip); };
        const skip = () => {
            if (finished) return; finished = true; cleanup();
            try { update(1); resolve(); } catch (error) { reject(error); }
        };
        const tick = now => {
            if (finished) return;
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(elapsed / seconds, 1);
            try { update(t * t * (3 - 2 * t)); }
            catch (error) { finished = true; cleanup(); reject(error); return; }
            if (t === 1) { finished = true; cleanup(); resolve(); }
            else frame = requestAnimationFrame(tick);
        };
        if (signal?.aborted || seconds <= 0) skip();
        else { signal?.addEventListener('abort', skip, { once: true }); frame = requestAnimationFrame(tick); }
    });
}

export function arms(root) {
    return ['ArmL', 'ArmR'].map(name => root.getObjectByName(name) || root.getObjectByName(name.replace('L', '.L').replace('R', '.R')))
        .filter(Boolean).map(bone => ({ bone, rest: bone.quaternion.clone() }));
}
const axis = new Vector3(1, 0, 0), turn = new Quaternion();
export function reach(bones, amount) {
    for (const { bone, rest } of bones) bone.quaternion.copy(rest).multiply(turn.setFromAxisAngle(axis, -amount));
}

