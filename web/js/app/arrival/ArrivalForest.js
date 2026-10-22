import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Continue the existing woodland beyond the camera instead of exposing lawn.
// Instances share adopted tree geometry; no changes to the playable boundary.
export function addArrivalForest(scene, landscape) {
    const source = scene.children.find(o => o.name.startsWith('boundary_tree_'));
    if (!source) return () => {};
    source.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(source);
    const width = bounds.getSize(new THREE.Vector3()).x;
    const center = bounds.getCenter(new THREE.Vector3());
    const points = [];
    for (let row = 0; row < 34; row++) {
        const y = -1000 + row * 98;
        for (let col = 0; col < 47; col++) {
            const x = -2400 + col * 180 + (row % 2) * 90;
            if (y > 80 && x > -210 && x < 3780) continue;
            points.push([x + Math.sin(col * 3 + row) * 18, y + Math.cos(row + col) * 14]);
        }
    }
    const group = new THREE.Group();
    group.name = 'arrival-distant-forest';
    const transform = new THREE.Matrix4();
    const normalize = new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z);
    source.traverse(mesh => {
        if (!mesh.isMesh) return;
        const materials = [mesh.material].flat().map(mat => mat.clone());
        const instances = new THREE.InstancedMesh(mesh.geometry, Array.isArray(mesh.material) ? materials : materials[0], points.length);
        const local = normalize.clone().multiply(mesh.matrixWorld);
        points.forEach(([x, y], i) => {
            const scale = (230 + (i % 4) * 12) / width;
            transform.makeScale(scale, scale, scale);
            transform.setPosition(x, 0, y / GROUND_PROJECTION);
            instances.setMatrixAt(i, transform.clone().multiply(local));
        });
        landscape.wrap(instances);
        for (const mat of materials) {
            const compile = mat.onBeforeCompile;
            mat.onBeforeCompile = (shader, renderer) => {
                compile(shader, renderer);
                shader.vertexShader = shader.vertexShader.replace(
                    'modelMatrix * vec4(transformed, 1.0)',
                    'modelMatrix * instanceMatrix * vec4(transformed, 1.0)');
            };
        }
        group.add(instances);
    });
    scene.add(group);
    return () => {
        group.removeFromParent();
        group.traverse(mesh => {
            if (!mesh.isInstancedMesh) return;
            [mesh.material].flat().forEach(mat => mat.dispose());
            mesh.dispose();
        });
    };
}
