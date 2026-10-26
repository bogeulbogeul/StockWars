import * as THREE from '../../../vendor/three/three.module.js';
import { loadCharacterAsset } from '../town3d/SomangiAssets.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y } from '../../data/somangiModels.js';
import { VIVIAN_MODEL_SCALE, VIVIAN_ROOM_BOUNDS, BONGBONG_POSITION } from '../../data/vivianModelRoom.js';

const modelUrl = new URL('../../../assets/characters/3d/bongbong/bongbong.glb', import.meta.url).href;

export async function addVivianShopkeeper(room) {
    const { model, animations } = await loadCharacterAsset(modelUrl);
    const root = new THREE.Group();
    root.name = 'bongbong-character';
    root.position.set(BONGBONG_POSITION.x / VIVIAN_MODEL_SCALE, VIVIAN_ROOM_BOUNDS.floorY,
        BONGBONG_POSITION.z / VIVIAN_MODEL_SCALE);
    const scale = SOMANGI_HEIGHT / SOMANGI_REFERENCE_HEIGHT / VIVIAN_MODEL_SCALE;
    model.scale.setScalar(scale);
    model.position.y = -SOMANGI_FOOT_Y * scale;
    model.traverse(object => { if (object.isMesh) object.castShadow = object.receiveShadow = true; });
    root.add(model);
    root.userData.greetingMixer = new THREE.AnimationMixer(model);
    root.userData.walkAction = root.userData.greetingMixer.clipAction(animations[0]);
    root.userData.smiling = true;
    room.add(root);
    return root;
}
