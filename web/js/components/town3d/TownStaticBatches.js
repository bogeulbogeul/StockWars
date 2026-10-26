import { Mesh, DynamicDrawUsage } from '../../../vendor/three/three.module.js';
import { mergeGeometries } from '../../../vendor/three/BufferGeometryUtils.js';

// Render-only copies. The authored scene remains the source of truth for
// collisions, seats, occlusion, names, clock hands, and visibility.
export class TownStaticBatches {
    constructor(scene) {
        this.enabled = true;
        this.groups = [];
        this.bufferBytes = 0;
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
        if (!mesh.isMesh || mesh.userData.dynamicDoor || mesh.isSkinnedMesh || mesh.morphTargetInfluences || Array.isArray(m)
            || !m?.isMeshStandardMaterial || m.transparent || m.opacity !== 1 || m.transmission
            || m.wireframe || g.groups.length > 1 || g.drawRange.start !== 0
            || g.drawRange.count !== Infinity || mesh.matrixWorld.determinant() <= 0) return false;
        // Keep large sculpted parts on the native path and bound copied memory.
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
        let vertices = 0, indices = 0, bytes = 0;
        for (const { mesh } of members) {
            const g = mesh.geometry;
            vertices += g.attributes.position.count;
            indices += g.index?.count || g.attributes.position.count;
            bytes += Object.values(g.attributes).reduce((sum, a) => sum + a.array.byteLength, 0);
        }
        // Batches own copied buffers; bound the extra memory on integrated GPUs.
        bytes += indices * (vertices > 65535 ? 4 : 2) * 2;
        if (vertices > 250000 || this.bufferBytes + bytes > 64 * 1024 * 1024) return;
        const first = members[0].mesh;
        const copies = members.map(({ mesh }) => mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
        const geometry = mergeGeometries(copies);
        for (const copy of copies) copy.dispose();
        if (!geometry) return;
        if (!geometry.index) geometry.setIndex(Array.from({ length: vertices }, (_, i) => i));
        geometry.index.setUsage(DynamicDrawUsage);
        const sourceIndices = geometry.index.array.slice();
        const batch = new Mesh(geometry, first.material);
        batch.name = 'town-render-batch';
        batch.userData.renderOnly = true;
        batch.raycast = () => {}; // Queries must continue to hit authored meshes.
        batch.frustumCulled = false;
        batch.renderOrder = first.renderOrder;
        batch.layers.mask = first.layers.mask;
        batch.visible = false;
        let start = 0;
        for (const member of members) {
            member.start = start;
            member.count = member.mesh.geometry.index?.count || member.mesh.geometry.attributes.position.count;
            member.indices = sourceIndices.subarray(member.start, member.start + member.count);
            if (!member.mesh.geometry.boundingSphere) member.mesh.geometry.computeBoundingSphere();
            member.center = member.mesh.geometry.boundingSphere.center.clone().applyMatrix4(member.mesh.matrixWorld);
            start += member.count;
        }
        scene.add(batch);
        this.groups.push({ batch, members, sourceIndices, ordered: [...members] });
        this.bufferBytes += bytes;
    }

    render(renderer, scene, camera) {
        if (!this.enabled || !this.groups.length) { renderer.render(scene, camera); return; }
        const hidden = [];
        try {
            const e = camera.matrixWorldInverse?.elements || [0,0,0,0,0,0,0,0,0,0,1];
            const direction = [e[2], e[6], e[10]];
            const resort = !this.direction || direction.some((v, i) => Math.abs(v - this.direction[i]) > 1e-8);
            this.direction = direction;
            // Decide all original visibility before hiding any parent mesh.
            for (const { batch, members, ordered } of this.groups) {
                let count = 0;
                let changed = resort;
                if (resort) {
                    const depth = ({ center: p }) => -(p.x * direction[0] + p.y * direction[1] + p.z * direction[2]);
                    ordered.sort((a, b) => depth(a) - depth(b));
                }
                for (const member of members) {
                    const visible = !member.mesh.userData.dynamicDoor && member.mesh.visible && member.parents.every(parent => parent.visible);
                    if (visible !== member.visible) changed = true;
                    member.visible = visible;
                    if (visible) { hidden.push(member.mesh); count++; }
                }
                batch.visible = count > 0;
                if (changed) {
                    // Compact only indices; vertex/normal/UV buffers stay static.
                    // This retains the existing per-part curved culling exactly.
                    let offset = 0;
                    for (const member of ordered) if (member.visible) {
                        batch.geometry.index.array.set(member.indices, offset);
                        offset += member.count;
                    }
                    batch.geometry.setDrawRange(0, offset);
                    if (offset) {
                        batch.geometry.index.clearUpdateRanges();
                        batch.geometry.index.addUpdateRange(0, offset);
                        batch.geometry.index.needsUpdate = true;
                    }
                }
            }
            for (const mesh of hidden) mesh.visible = false;
            renderer.render(scene, camera);
        } finally {
            for (const mesh of hidden) mesh.visible = true;
            for (const { batch } of this.groups) batch.visible = false;
        }
    }
}
