import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';

// Fixed shopkeeper beside the counter; no additional gameplay state.
export async function addVivianShopkeeper(room) {
    const url = new URL('../../../assets/characters/3d/bongbong/Bongbong.glb', import.meta.url).href;
    const { scene: model } = await new GLTFLoader().loadAsync(url);
    model.name = 'bongbong-shopkeeper';
    model.scale.setScalar((100 / 75) / 1.9);
    model.updateMatrixWorld(true);
    const ground = new THREE.Box3().setFromObject(model, true).min.y;
    // Blender front (-Y) is Three +Z, toward the entrance and customer.
    model.position.set(2.05, .025 - ground, -1.30);
    model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;
    });
    room.add(model);
    return model;
}
