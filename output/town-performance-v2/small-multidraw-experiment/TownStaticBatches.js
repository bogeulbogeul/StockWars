import { BatchedMesh } from '../../../vendor/three/three.module.js';

// Render-only copies. The authored scene remains the source of truth for
// collisions, seats, occlusion, names, clock hands, and visibility.
export class TownStaticBatches {
    constructor(scene, renderer) {
        this.enabled = true;
        this.groups = [];
        this.bufferBytes = 0;
        if (!renderer.extensions.has('WEBGL_multi_draw')) return;
        const groups = new Map();
        for (const root of scene.children.filter(o => o.userData.dialogueOccluder)) {
            root.traverse(mesh => {
                if (!this.eligible(mesh, root)) return;
                const geometry = mesh.geometry, material = mesh.material;
                const layout = Object.keys(geometry.attributes).sort().map(name => {
                    const a = geometry.attributes[name];
                    return `${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`;
                }).join('|');
                const key = `${material.uuid}:${mesh.renderOrder}:${mesh.layers.mask}:${!!geometry.index}:${layout}`;
                if (!groups.has(key)) groups.set(key, []);
                const parents = [];
                for (let node = mesh.parent; node && node !== scene; node = node.parent) parents.push(node);
                groups.get(key).push({ mesh, parents, visible: false });
            });
        }
        for (const members of groups.values()) this.add(scene, members);
    }

    eligible(mesh, root) {
        const g = mesh.geometry, m = mesh.material;
        if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.morphTargetInfluences || Array.isArray(m)
            || !m?.isMeshStandardMaterial || m.transparent || m.opacity !== 1 || m.transmission
            || m.wireframe || g.groups.length > 1 || g.drawRange.start !== 0
            || g.drawRange.count !== Infinity || mesh.matrixWorld.determinant() <= 0) return false;
        // Multi-draw adds a vertex-texture matrix lookup. High-poly trunks,
        // foliage and sculpted building parts are faster on the native path.
        if ((g.index?.count || g.attributes.position.count) > 512 * 3) return false;
        // Instanced buffers and animated subtrees must retain their own renderer.
        if (Object.values(g.attributes).some(a => a.isInterleavedBufferAttribute || a.isInstancedBufferAttribute)) return false;
        for (let node = mesh; node && node !== root; node = node.parent) {
            if (/^Clock_(Hour|Minute)/.test(node.name)) return false;
        }
        return true;
    }

    add(scene, members) {
        if (members.length < 4) return;
        const geometries = new Map(members.map(({ mesh }) => [mesh.geometry, null]));
        let vertices = 0, indices = 0, bytes = 0;
        for (const g of geometries.keys()) {
            vertices += g.attributes.position.count;
            indices += g.index?.count || 0;
            bytes += Object.values(g.attributes).reduce((sum, a) => sum + a.array.byteLength, 0);
        }
        // Batches own copied buffers; bound the extra memory on integrated GPUs.
        bytes += indices * (vertices > 65535 ? 4 : 2);
        if (vertices > 250000 || this.bufferBytes + bytes > 64 * 1024 * 1024) return;
        const first = members[0].mesh;
        const batch = new BatchedMesh(members.length, vertices, indices, first.material);
        batch.name = 'town-render-batch';
        batch.frustumCulled = batch.perObjectFrustumCulled = batch.sortObjects = false;
        batch.renderOrder = first.renderOrder;
        batch.layers.mask = first.layers.mask;
        batch.visible = false;
        try {
            for (const geometry of geometries.keys()) geometries.set(geometry, batch.addGeometry(geometry));
            for (const member of members) {
                member.id = batch.addInstance(geometries.get(member.mesh.geometry));
                batch.setMatrixAt(member.id, member.mesh.matrixWorld);
                batch.setVisibleAt(member.id, false);
            }
        } catch (error) {
            batch.dispose();
            console.warn('마을 렌더 묶음 대신 원본 모델을 사용합니다.', error);
            return;
        }
        scene.add(batch);
        this.groups.push({ batch, members });
        this.bufferBytes += bytes;
    }

    render(renderer, scene, camera) {
        if (!this.enabled || !this.groups.length) { renderer.render(scene, camera); return; }
        const hidden = [];
        try {
            // Decide all original visibility before hiding any parent mesh.
            for (const { batch, members } of this.groups) {
                let count = 0;
                for (const member of members) {
                    const visible = member.mesh.visible && member.parents.every(parent => parent.visible);
                    if (visible !== member.visible) batch.setVisibleAt(member.id, visible);
                    member.visible = visible;
                    if (visible) { hidden.push(member.mesh); count++; }
                }
                batch.visible = count > 0;
            }
            for (const mesh of hidden) mesh.visible = false;
            renderer.render(scene, camera);
        } finally {
            for (const mesh of hidden) mesh.visible = true;
            for (const { batch } of this.groups) batch.visible = false;
        }
    }
}
