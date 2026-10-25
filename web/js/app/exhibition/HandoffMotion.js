import { Vector3, Quaternion } from '../../../vendor/three/three.module.js';
export function animate(seconds, update) {
    return new Promise(resolve => {
        let previous, elapsed = 0;
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(elapsed / seconds, 1); update(t * t * (3 - 2 * t));
            if (t === 1) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
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

