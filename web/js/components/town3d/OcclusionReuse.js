import { Vector3 } from '../../../vendor/three/three.module.js';

// Reuse only an unchanged view for at most 80ms. Moving either the camera,
// actor or an occluder invalidates immediately; animated details refresh too.
export class OcclusionReuse {
    constructor() { this.point = new Vector3(); this.previous = null; this.time = 0; }
    invalidate() { this.previous = null; }
    shouldUpdate(camera, actors, roots, now = performance.now()) {
        camera.updateWorldMatrix(true, false);
        const next = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements];
        for (const actor of actors) {
            const root = actor?.root || actor;
            if (!root) { next.push(null); continue; }
            root.getWorldPosition(this.point);
            next.push(root.uuid, root.visible, this.point.x, this.point.y, this.point.z);
        }
        for (const root of roots) {
            root.updateWorldMatrix(true, false);
            next.push(root.uuid, root.visible, ...root.matrixWorld.elements);
        }
        const same = this.previous && next.length === this.previous.length && next.every((value, i) => value === this.previous[i]);
        if (same && now - this.time < 80) return false;
        this.previous = next; this.time = now; return true;
    }
}
