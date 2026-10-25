import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { BANK_MODEL_URL, BANK_MODEL_SCALE } from '../../data/bankModelRoom.js';
import { addBankChagok } from './BankChagok.js';
import { MoaCharacter } from '../town3d/MoaCharacter.js';
import { createBankConversationCamera } from './BankConversationCamera.js';

export function buildBankModelRoom(scene) {
    const room = new THREE.Group();
    room.name = 'node-bank-interior';
    scene.add(room);
    const moa = new MoaCharacter(room, { x: 120, z: 115, rotation: Math.PI });
    room.userData.moa = moa; room.userData.moaReady = moa.ready;
    room.userData.update = dt => moa.update(dt);
    room.userData.cameraRig = createBankConversationCamera(room);
    const shellReady = new GLTFLoader().loadAsync(BANK_MODEL_URL).then(gltf => {
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
    room.userData.chagokReady = addBankChagok(room).then(root => { room.userData.chagok = root; return root; });
    room.userData.shellReady = Promise.all([shellReady, room.userData.chagokReady]).then(([model]) => model);
    return room;
}
