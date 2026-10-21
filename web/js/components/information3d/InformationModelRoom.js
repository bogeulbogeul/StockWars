import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { INFORMATION_MODEL_URL } from '../../data/informationModelRoom.js';

export function buildInformationModelRoom(scene) {
    const room = new THREE.Group();
    room.name = 'settlement-information-interior';
    scene.add(room);
    room.userData.shellReady = new GLTFLoader().loadAsync(INFORMATION_MODEL_URL).then(gltf => {
        const model = gltf.scene;
        model.name = 'information-furnished-room';
        model.scale.setScalar(100);
        model.position.y = -2.2;
        model.traverse(object => {
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
        });
        room.add(model);
        return model;
    });
    return room;
}
