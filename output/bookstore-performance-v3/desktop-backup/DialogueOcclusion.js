import { Box3, Raycaster, Vector3 } from '../../../vendor/three/three.module.js';

// Temporarily hide the blocking instance, preserving its original visibility.
// Materials and collisions stay untouched, including shared tree materials.
export function createDialogueOcclusion(scene) {
    const ray = new Raycaster(), bounds = new WeakMap(), hidden = new Map();
    const target = new Vector3(), direction = new Vector3(), right = new Vector3();
    const hitPoint = new Vector3(), projected = new Vector3();
    function begin(root) {
        const meshes = [];
        root.traverse(mesh => {
            if (!mesh.isMesh) return;
            meshes.push({ mesh, visible: mesh.visible });
            mesh.visible = false;
        });
        const shadow = root.contactShadow;
        if (shadow) { meshes.push({ mesh: shadow, visible: shadow.visible }); shadow.visible = false; }
        hidden.set(root, meshes);
    }
    function restore(root, meshes) {
        for (const { mesh, visible } of meshes) mesh.visible = visible;
        hidden.delete(root);
    }
    return {
        update(camera, actors) {
            const hits = new Set();
            const roots = scene.children.filter(root => root.userData.dialogueOccluder && root.visible);
            scene.updateMatrixWorld(true);
            right.set(1, 0, 0).applyQuaternion(camera.quaternion);
            for (const actor of actors) {
                if (!actor?.root?.visible) continue;
                actor.root.getWorldPosition(projected); projected.y += 60; projected.project(camera);
                if (Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15 || projected.z < -1 || projected.z > 1) continue;
                for (const [height, offset] of [[80, -22], [80, 0], [80, 22], [48, -18], [48, 18], [15, 0]]) {
                    actor.root.getWorldPosition(target); target.y += height; target.addScaledVector(right, offset);
                    direction.subVectors(target, camera.position);
                    ray.far = direction.length() - 18; ray.set(camera.position, direction.normalize());
                    const candidates = roots.filter(root => {
                        // One hit already hides the entire root for this frame.
                        // Keep testing other roots so overlapping blockers behave
                        // exactly as before, including animated clock hands.
                        if (hits.has(root)) return false;
                        if (!bounds.has(root)) bounds.set(root, new Box3().setFromObject(root));
                        const box = bounds.get(root);
                        if (box.containsPoint(camera.position)) { hits.add(root); return false; }
                        const point = ray.ray.intersectBox(box, hitPoint);
                        return point && point.distanceTo(camera.position) <= ray.far;
                    });
                    for (const hit of ray.intersectObjects(candidates, true)) {
                        let root = hit.object;
                        while (root.parent && !root.userData.dialogueOccluder) root = root.parent;
                        if (root.userData.dialogueOccluder) hits.add(root);
                    }
                }
            }
            for (const root of hits) if (!hidden.has(root)) begin(root);
            for (const [root, meshes] of hidden) if (!hits.has(root)) restore(root, meshes);
        },
        reset() { for (const [root, meshes] of hidden) restore(root, meshes); },
        dispose() { for (const [root, meshes] of hidden) restore(root, meshes); }
    };
}
