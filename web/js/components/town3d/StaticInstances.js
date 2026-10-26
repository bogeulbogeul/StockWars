import { InstancedMesh } from '../../../vendor/three/three.module.js';

// Only render static copies. Authored objects remain available to collision,
// interaction and occlusion queries, with their original visibility restored.
export class StaticInstances {
    constructor(scene, roots) {
        this.enabled = true;
        this.groups = [];
        const groups = new Map();
        scene.updateMatrixWorld(true);
        for (const root of roots) root.traverse(mesh => {
            if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.isInstancedMesh || mesh.morphTargetInfluences
                || mesh.userData.dynamicDoor || Array.isArray(mesh.material)
                || !mesh.material?.isMeshStandardMaterial || mesh.material.transparent
                || mesh.material.opacity !== 1 || mesh.material.transmission || mesh.material.wireframe
                || mesh.matrixWorld.determinant() <= 0) return;
            const parents = [];
            for (let node = mesh; node && node !== scene; node = node.parent) {
                if (node.userData.dynamicDoor || node.isBone || /^(moa-character|chagok-character|tori-character|bongbong-character|Clock_(Hour|Minute))/.test(node.name)) return;
                if (node !== mesh) parents.push(node);
            }
            const key = `${mesh.geometry.uuid}:${mesh.material.uuid}:${mesh.renderOrder}:${mesh.layers.mask}:${mesh.castShadow}:${mesh.receiveShadow}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({ mesh, parents, matrix: mesh.matrixWorld.clone(), visible: false });
        });
        for (const members of groups.values()) {
            if (members.length < 3) continue;
            const first = members[0].mesh;
            const batch = new InstancedMesh(first.geometry, first.material, members.length);
            batch.name = 'static-render-instances'; batch.userData.renderOnly = true;
            batch.raycast = () => {}; batch.frustumCulled = false;
            batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow;
            batch.renderOrder = first.renderOrder; batch.layers.mask = first.layers.mask;
            batch.visible = false;
            for (const member of members) member.mesh.userData.renderInstanced = true;
            scene.add(batch); this.groups.push({ batch, members });
        }
    }

    render(draw) {
        if (!this.enabled) return draw();
        const hidden = [];
        try {
            // Evaluate all parent visibility before hiding any original mesh.
            for (const { batch, members } of this.groups) {
                let count = 0, changed = false;
                for (const member of members) {
                    const visible = member.mesh.visible && member.parents.every(parent => parent.visible);
                    if (visible !== member.visible) changed = true;
                    member.visible = visible;
                    if (visible) { batch.setMatrixAt(count++, member.matrix); hidden.push(member.mesh); }
                }
                batch.count = count; batch.visible = count > 0;
                if (changed) batch.instanceMatrix.needsUpdate = true;
            }
            for (const mesh of hidden) mesh.visible = false;
            return draw();
        } finally {
            for (const mesh of hidden) mesh.visible = true;
            for (const { batch } of this.groups) batch.visible = false;
        }
    }
}
