import * as THREE from '../../../vendor/three/three.module.js';
import { loadCharacterAsset } from '../town3d/SomangiAssets.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT } from '../../data/somangiModels.js';
import { CHAGOK_POSITION } from '../../data/bankModelRoom.js';

const modelUrl = new URL('../../../assets/characters/3d/chagok/chagok.glb', import.meta.url).href;

export async function addBankChagok(room) {
    const { model } = await loadCharacterAsset(modelUrl);
    const root = new THREE.Group();
    root.name = 'chagok-character';
    root.position.set(CHAGOK_POSITION.x, CHAGOK_POSITION.seatY, CHAGOK_POSITION.z);
    const scale = SOMANGI_HEIGHT / SOMANGI_REFERENCE_HEIGHT;
    model.scale.setScalar(scale);
    // The dedicated static pose has its pelvis contact at local Y = 0.
    model.traverse(object => { if (object.isMesh) object.castShadow = object.receiveShadow = true; });
    root.add(model);
    room.add(root);
    return root;
}
