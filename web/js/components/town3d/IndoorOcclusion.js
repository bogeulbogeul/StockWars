import { Box3, Raycaster, Vector3, DoubleSide } from '../../../vendor/three/three.module.js';
import { isWallMesh } from './IndoorWallBodies.js';

export function isIndoorOccluder(mesh) {
    return mesh.isMesh && (isWallMesh(mesh) || /^Wall_(Front|Back|Left|Right)$/.test(mesh.name)
        || /(^|_)(Window|Window_Frame|Cornice|Wall_Trim)(_|\.|$)/i.test(mesh.name));
}

// Apply only for rendering, then restore immediately. Room cutaways and
// collision meshes retain their original state and never inherit our hides.
export function createIndoorOcclusion(room) {
    const walls = [], hidden = [], ray = new Raycaster(), hits = [];
    const target = new Vector3(), direction = new Vector3(), right = new Vector3(), projected = new Vector3();
    room.updateMatrixWorld(true);
    room.traverse(mesh => { if (isIndoorOccluder(mesh)) walls.push({ mesh, bounds: new Box3().setFromObject(mesh) }); });
    const reset = () => { for (const mesh of hidden) mesh.visible = true; hidden.length = 0; };
    return {
        reset,
        update(camera, actors) {
            reset(); room.updateMatrixWorld(true); camera.updateMatrixWorld(true);
            right.set(1, 0, 0).applyQuaternion(camera.quaternion);
            const blocked = new Set();
            for (const actor of actors) {
                const root = actor?.root || actor;
                if (!root?.visible) continue;
                root.getWorldPosition(projected); projected.y += 60; projected.project(camera);
                if (Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15 || Math.abs(projected.z) > 1) continue;
                for (const [height, offset] of [[80, -22], [80, 0], [80, 22], [48, -18], [48, 18], [15, 0]]) {
                    root.getWorldPosition(target); target.y += height; target.addScaledVector(right, offset);
                    direction.subVectors(target, camera.position); ray.far = direction.length() - 18;
                    ray.set(camera.position, direction.normalize());
                    for (const { mesh, bounds } of walls) {
                        if (!mesh.visible || blocked.has(mesh) || !ray.ray.intersectsBox(bounds)) continue;
                        const materials = [mesh.material].flat(), sides = materials.map(material => material.side);
                        try {
                            materials.forEach(material => { material.side = DoubleSide; });
                            hits.length = 0; mesh.raycast(ray, hits);
                            if (hits.length) blocked.add(mesh);
                        } finally { materials.forEach((material, i) => { material.side = sides[i]; }); }
                    }
                }
            }
            for (const mesh of blocked) { mesh.visible = false; hidden.push(mesh); }
            return hidden.length;
        }
    };
}

export function renderIndoorWithOcclusion(owner) {
    owner.indoorOcclusion ||= createIndoorOcclusion(owner.room);
    const actors = [owner.player];
    owner.room.traverse(root => { if (/^(moa-character|chagok-character|tori-character|bongbong-character)$/.test(root.name)) actors.push(root); });
    // Home Moa belongs to the scene rather than the scaled room model.
    if (owner.room.userData.moa) actors.push(owner.room.userData.moa);
    owner.indoorOcclusion.update(owner.camera, actors);
    try { owner.renderer.render(owner.scene, owner.camera); }
    finally { owner.indoorOcclusion.reset(); }
}
