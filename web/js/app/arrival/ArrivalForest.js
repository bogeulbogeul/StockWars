import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Continue the existing woodland beyond the camera instead of exposing lawn.
// Instances share adopted tree geometry; no changes to the playable boundary.
export async function addArrivalForest(scene, landscape) {
    let source = scene.children.find(o => o.name.startsWith('boundary_tree_'));
    if (!source) return () => {};
    const nativeSource = source;
    let owned = false;
    try {
        const gltf = await new GLTFLoader().loadAsync(new URL('../../../assets/props/3d/CommonTree-forest-lite.glb', import.meta.url).href);
        source = gltf.scene; owned = true;
    } catch (error) { console.warn('원경 숲 경량본 대신 원본을 사용합니다.', error.message); }
    source.updateMatrixWorld(true);
    const replacements = new Map(), targets = [];
    if (owned) {
        nativeSource.updateWorldMatrix(true, true);
        const nativeInverse = nativeSource.matrixWorld.clone().invert();
        nativeSource.traverse(mesh => {
            if (!mesh.isMesh) return;
            const lite = source.getObjectByName(mesh.name);
            if (!lite?.isMesh) return;
            const nativeLocal = nativeInverse.clone().multiply(mesh.matrixWorld);
            const transform = nativeLocal.invert().multiply(lite.matrixWorld);
            replacements.set(mesh.geometry, lite.geometry.clone().applyMatrix4(transform));
        });
        scene.traverse(mesh => {
            const geometry = replacements.get(mesh.geometry);
            if (mesh.isMesh && geometry) targets.push({ mesh, original: mesh.geometry, geometry });
        });
    }
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
    if (owned) source.traverse(mesh => {
        for (const material of [mesh.material].flat()) material?.dispose();
    });
    scene.add(group);
    const dispose = () => {
        group.removeFromParent();
        for (const geometry of replacements.values()) geometry.dispose();
        group.traverse(mesh => {
            if (!mesh.isInstancedMesh) return;
            [mesh.material].flat().forEach(mat => mat.dispose());
            if (owned) mesh.geometry.dispose();
            mesh.dispose();
        });
    };
    dispose.render = (draw, wide) => {
        if (!wide) return draw();
        try {
            for (const { mesh, geometry } of targets) mesh.geometry = geometry;
            return draw();
        } finally { for (const { mesh, original } of targets) mesh.geometry = original; }
    };
    return dispose;
}
