import * as THREE from '../../../vendor/three/three.module.js';
import { loadCharacterAsset } from '../town3d/SomangiAssets.js';
import { SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y } from '../../data/somangiModels.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

const modelUrl = new URL('../../../assets/characters/3d/tori/tori.glb', import.meta.url).href;

export async function addCipherAgentK(room) {
    const { model } = await loadCharacterAsset(modelUrl);
    const root = new THREE.Group();
    root.name = 'tori-character';
    root.position.set(LOBBY.agentK.x, 0, LOBBY.agentK.z);
    const scale = LOBBY.agentK.bodyHeight / SOMANGI_REFERENCE_HEIGHT;
    model.scale.setScalar(scale);
    model.position.y = -SOMANGI_FOOT_Y * scale;
    model.traverse(object => { if (object.isMesh) object.castShadow = object.receiveShadow = true; });
    root.add(model);
    room.add(root);
    return root;
}
