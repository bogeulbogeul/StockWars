import { OcclusionReuse } from './OcclusionReuse.js';
import { StaticInstances } from './StaticInstances.js';
import { TownStaticBatches } from './TownStaticBatches.js';
import { Box3, Raycaster, Vector3, DoubleSide } from '../../../vendor/three/three.module.js';
import { isWallMesh } from './IndoorWallBodies.js';
import { isCharacterSpeaking } from './SpeechVisibility.js';
import { createOcclusionQueries } from './OcclusionQueries.js';

export function isIndoorOccluder(mesh) {
    return mesh.isMesh && (isWallMesh(mesh) || /^Wall_(Front|Back|Left|Right)$/.test(mesh.name)
        || /(^|_)(Window|Window_Frame|Cornice|Wall_Trim)(_|\.|$)/i.test(mesh.name));
}

function furnitureKey(mesh, room) {
    for (let node = mesh.parent; node && node !== room; node = node.parent)
        if (/_Root$|^cipher-cozy-desk$/.test(node.name)) return node;
    // These authored store fixtures are flat GLB meshes rather than groups.
    if (/^(Counter_|Register_|Payment_)/.test(mesh.name)) return 'store-counter';
    if (/^Packing_/.test(mesh.name)) return 'packing-workstation';
    if (/^(Cream_Desk_Body|Rounded_Wood_Countertop|Front_Panel_Joint|Desk_)/.test(mesh.name)) return 'office-desk';
    return mesh;
}

// Apply only for rendering, then restore immediately. Room cutaways and
// collision meshes retain their original state and never inherit our hides.
export function createIndoorOcclusion(room) {
    const walls = [], props = [], hidden = [], ray = new Raycaster();
    const queries = createOcclusionQueries();
    const furniture = new Map(), membership = new Map();
    const target = new Vector3(), direction = new Vector3(), right = new Vector3(), projected = new Vector3();
    room.updateMatrixWorld(true);
    room.traverse(mesh => {
        if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.userData.renderOnly) return;
        for (let node = mesh; node && node !== room; node = node.parent)
            if (node.isBone || /^(moa-character|chagok-character|tori-character|bongbong-character)/.test(node.name)) return;
        const entry = { mesh, bounds: new Box3().setFromObject(mesh) };
        if (isIndoorOccluder(mesh)) walls.push(entry);
        else if (!/(floor|ground|carpet|rug|shadow)/i.test(mesh.name)) {
            props.push(entry);
            const key = furnitureKey(mesh, room);
            if (!furniture.has(key)) furniture.set(key, []);
            furniture.get(key).push(mesh); membership.set(mesh, key);
        }
        queries.prepare(mesh);
    });
    const reuse = new OcclusionReuse();
    let cachedBlocked = [];
    let previousSpeaking;
    const reset = () => { for (const mesh of hidden) mesh.visible = true; hidden.length = 0; };
    return {
        reset,
        update(camera, actors, { speaking = isCharacterSpeaking() } = {}) {
            reset();
            if (previousSpeaking !== speaking) reuse.invalidate();
            previousSpeaking = speaking;
            const candidates = speaking ? [...walls, ...props] : walls;
            if (!reuse.shouldUpdate(camera, actors, candidates.map(wall => wall.mesh))) {
                for (const mesh of cachedBlocked) { mesh.visible = false; hidden.push(mesh); }
                return hidden.length;
            }
            room.updateMatrixWorld(true); camera.updateMatrixWorld(true);
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
                    for (const { mesh, bounds } of candidates) {
                        if (!mesh.visible || blocked.has(mesh) || !ray.ray.intersectsBox(bounds)) continue;
                        let excluded = false;
                        for (let node = mesh; node; node = node.parent) {
                            if (!node.visible || actors.some(actor => (actor?.root || actor) === node)) { excluded = true; break; }
                        }
                        if (excluded) continue;
                        const materials = [mesh.material].flat(), sides = materials.map(material => material.side);
                        try {
                            materials.forEach(material => { material.side = DoubleSide; });
                            if (queries.intersects(mesh, ray)) blocked.add(mesh);
                        } finally { materials.forEach((material, i) => { material.side = sides[i]; }); }
                    }
                }
            }
            if (speaking) for (const mesh of [...blocked]) {
                const key = membership.get(mesh);
                if (key === undefined) continue;
                for (const part of furniture.get(key)) {
                    let visible = true;
                    for (let node = part; node; node = node.parent) if (!node.visible) { visible = false; break; }
                    if (visible) blocked.add(part);
                }
            }
            cachedBlocked = [...blocked];
            for (const mesh of blocked) { mesh.visible = false; hidden.push(mesh); }
            return hidden.length;
        }
    };
}

export function prepareIndoorRendering(owner) {
    owner.indoorOcclusion ||= createIndoorOcclusion(owner.room);
    owner.staticInstances ||= new StaticInstances(owner.scene, [owner.room]);
    owner.staticBatches ||= new TownStaticBatches(owner.scene, [owner.room]);
}

export function renderIndoorWithOcclusion(owner) {
    if (owner.renderer.shadowMap) owner.renderer.shadowMap.enabled = !!owner.scene.userData.gameShadows;
    prepareIndoorRendering(owner);
    const actors = [owner.player];
    owner.room.traverse(root => { if (/^(moa-character|chagok-character|tori-character|bongbong-character)$/.test(root.name)) actors.push(root); });
    // Home Moa belongs to the scene rather than the scaled room model.
    if (owner.room.userData.moa) actors.push(owner.room.userData.moa);
    owner.indoorOcclusion.update(owner.camera, actors);
    try { owner.staticInstances.render(() => owner.staticBatches.render(owner.renderer, owner.scene, owner.camera)); }
    finally { owner.indoorOcclusion.reset(); }
}
