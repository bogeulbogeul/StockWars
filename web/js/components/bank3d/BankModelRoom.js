import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { BANK_MODEL_URL, BANK_MODEL_SCALE } from '../../data/bankModelRoom.js';

export function buildBankModelRoom(scene) {
    const room = new THREE.Group();
    room.name = 'node-bank-interior';
    scene.add(room);
    room.userData.shellReady = new GLTFLoader().loadAsync(BANK_MODEL_URL).then(gltf => {
        const model = gltf.scene;
        model.name = 'bank-furnished-room';
        model.scale.setScalar(BANK_MODEL_SCALE);
        model.position.y = -2.4; // Tile top is .024 in the Blender source.
        model.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
        });
        room.add(model);
        return model;
    });
    return room;
}
