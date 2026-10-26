import { Box3, Frustum, Matrix4 } from '../../../vendor/three/three.module.js';

// Static scenery only. Keep collision/raycast visibility intact outside render().
// The shader bends world Y by a monotonic function of world Z. Enclosing both
// endpoint displacements therefore also encloses every vertex between them.
export class TownRenderCulling {
    constructor() {
        this.entries = [];
        this.frustum = new Frustum();
        this.matrix = new Matrix4();
        this.bent = new Box3();
        this.enabled = true;
    }

    add(root) {
        const bounds = new Box3().setFromObject(root);
        if (!bounds.isEmpty()) this.entries.push({ root, bounds: bounds.expandByScalar(2) });
        root.traverse(mesh => {
            if (mesh === root || !mesh.isMesh || mesh.isSkinnedMesh || mesh.morphTargetInfluences) return;
            // These hands rotate continuously. Their building's enclosing box
            // is safe, but a cached individual hand box would become stale.
            for (let node = mesh; node && node !== root; node = node.parent) {
                if (/^Clock_(Hour|Minute)/.test(node.name)) return;
            }
            const box = new Box3().setFromObject(mesh);
            if (!box.isEmpty()) this.entries.push({ root: mesh, owner: root, bounds: box.expandByScalar(2) });
        });
    }

    render(renderer, scene, camera, centerZ) {
        const render = () => this.batches ? this.batches.render(renderer, scene, camera) : renderer.render(scene, camera);
        if (!this.enabled) { render(); return; }
        camera.updateMatrixWorld();
        this.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.matrix);
        const hidden = [];
        const bend = z => .00018 * Math.max(0, centerZ - z - 1100) ** 2;
        try {
            for (const { root, owner, bounds } of this.entries) {
                if (root.userData.dynamicDoor) continue;
                if (!root.visible || (owner && !owner.visible)) continue;
                this.bent.copy(bounds);
                this.bent.min.y -= bend(bounds.min.z);
                this.bent.max.y -= bend(bounds.max.z);
                if (!this.frustum.intersectsBox(this.bent)) {
                    root.visible = false;
                    hidden.push(root);
                }
            }
            render();
        } finally {
            for (const root of hidden) root.visible = true;
        }
    }
}
