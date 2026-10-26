import * as THREE from '../../../vendor/three/three.module.js';
import { mergeGeometries } from '../../../vendor/three/BufferGeometryUtils.js';

// Static product decorations contain many small seeds/flowers. Bake their exact
// transforms and merge compatible opaque pieces, retaining every vertex and UV.
// Transparent pieces stay separate so glass and printed labels keep their order.
export function batchShopItem(source) {
    source.updateMatrixWorld(true);
    const result = new THREE.Group();
    result.name = source.name;
    const batches = new Map();
    source.traverse(mesh => {
        if (!mesh.isMesh) return;
        const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
        const material = mesh.material;
        if (Array.isArray(material) || material.transparent || material.transmission > 0
            || mesh.isSkinnedMesh || Object.keys(geometry.morphAttributes).length) {
            const part = new THREE.Mesh(geometry, material);
            part.name = mesh.name;
            result.add(part);
            return;
        }
        const layout = Object.entries(geometry.attributes).map(([name, attr]) =>
            `${name}:${attr.itemSize}:${attr.normalized}:${attr.array.constructor.name}`).sort().join('|');
        const key = `${material.uuid}:${!!geometry.index}:${layout}`;
        if (!batches.has(key)) batches.set(key, { material, geometries: [] });
        batches.get(key).geometries.push(geometry);
    });
    for (const { material, geometries } of batches.values()) {
        const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries);
        if (merged) {
            result.add(new THREE.Mesh(merged, material));
            if (geometries.length > 1) geometries.forEach(geometry => geometry.dispose());
        } else {
            geometries.forEach(geometry => result.add(new THREE.Mesh(geometry, material)));
        }
    }
    return result;
}
