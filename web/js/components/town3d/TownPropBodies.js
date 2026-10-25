import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_HEIGHT } from './CharacterBodies.js';

// Fixed rigid bodies: only mesh triangles overlapping the player's vertical
// volume contribute. High roofs/canopies do not become invisible solid walls.
export function createTownPropBodies(model, id, { includeMesh = () => true, minHeight = 1,
    splitTriangles = false, maxHeight = PLAYER_BODY_HEIGHT } = {}) {
    model.updateMatrixWorld(true);
    if (model.userData.walkThrough) {
        model.userData.rigidBody = { type: 'static', colliderCount: 0 };
        return [];
    }
    const bodies = [];
    // Town placement grounds the model's lowest vertex at world height zero;
    // the authored origin can be above/below that floor.
    const floor = 0;
    model.traverse(mesh => {
        if (!mesh.isMesh || !mesh.geometry?.attributes.position || !includeMesh(mesh)) return;
        const geometry = mesh.geometry;
        const vertices = geometry.attributes.position;
        const index = geometry.index;
        const count = index ? index.count : vertices.count;
        const split = typeof splitTriangles === 'function' ? splitTriangles(mesh) : splitTriangles;
        const bounds = new THREE.Box3();
        const append = () => {
            if (bounds.isEmpty()) return;
            bodies.push({ id, mesh: mesh.name, type: 'static',
                minX: bounds.min.x, maxX: bounds.max.x,
                minY: bounds.min.z * GROUND_PROJECTION,
                maxY: bounds.max.z * GROUND_PROJECTION });
        };
        const triangle = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
        for (let i = 0; i + 2 < count; i += 3) {
            if (split) bounds.makeEmpty();
            triangle.forEach((point, j) => point.fromBufferAttribute(vertices,
                index ? index.getX(i + j) : i + j).applyMatrix4(mesh.matrixWorld));
            if (Math.min(...triangle.map(p => p.y)) > floor + maxHeight
                || Math.max(...triangle.map(p => p.y)) < floor + minHeight) continue;
            // Clip triangle edges at the body-height limits before projecting.
            for (let j = 0; j < 3; j++) {
                const a = triangle[j], b = triangle[(j + 1) % 3];
                if (a.y >= floor + minHeight && a.y <= floor + maxHeight) bounds.expandByPoint(a);
                for (const height of [floor + minHeight, floor + maxHeight]) {
                    if ((a.y < height && b.y > height) || (a.y > height && b.y < height)) {
                        bounds.expandByPoint(a.clone().lerp(b, (height - a.y) / (b.y - a.y)));
                    }
                }
            }
            if (split) append();
        }
        if (!split) append();
    });
    model.userData.rigidBody = { type: 'static', colliderCount: bodies.length };
    return bodies;
}
