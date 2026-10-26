import { Mesh } from '../../../vendor/three/three.module.js';
import { TriangleRayIndex } from './TriangleRayIndex.js';

const MIN_TRIANGLES = 100000;

function eligible(mesh) {
    const g = mesh.geometry, p = g?.attributes.position;
    return mesh.isMesh && !mesh.isSkinnedMesh && !mesh.isInstancedMesh && !mesh.morphTargetInfluences
        && mesh.raycast === Mesh.prototype.raycast && !Array.isArray(mesh.material) && !!mesh.material
        && p?.itemSize === 3 && !p.normalized && !p.isInterleavedBufferAttribute
        && p.array instanceof Float32Array && !g.index?.isInterleavedBufferAttribute
        && g.drawRange.start === 0 && g.drawRange.count >= (g.index?.count || p.count);
}

export function createOcclusionQueries() {
    const indices = new WeakMap(), nativeHits = [];
    const queries = {
        enabled: true,
        preparedCount: 0,
        preparedBytes: 0,
        prepare(root) {
            root.traverse(mesh => {
                if (!eligible(mesh)) return;
                const geometry = mesh.geometry;
                if ((geometry.index?.count || geometry.attributes.position.count) < MIN_TRIANGLES * 3 || indices.has(geometry)) return;
                const index = new TriangleRayIndex(geometry);
                indices.set(geometry, index);
                queries.preparedCount++;
                queries.preparedBytes += index.order.byteLength + index.bounds.byteLength + index.nodes.byteLength;
            });
        },
        intersects(root, raycaster) {
            if (!queries.enabled) return raycaster.intersectObject(root, true).length > 0;
            function visit(object) {
                if (object.layers.test(raycaster.layers)) {
                    const index = indices.get(object.geometry);
                    if (index && eligible(object) && index.matches(object.geometry)) {
                        if (index.intersects(object, raycaster)) return true;
                    } else {
                        nativeHits.length = 0;
                        const propagate = object.raycast(raycaster, nativeHits);
                        if (nativeHits.length) return true;
                        if (propagate === false) return false;
                    }
                }
                for (const child of object.children) if (visit(child)) return true;
                return false;
            }
            return visit(root);
        }
    };
    return queries;
}
