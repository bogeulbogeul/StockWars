import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

// Fixed staff placement. Keep the source rest pose rather than playing a walk.
export async function addCipherAgentK(room) {
    const url = new URL('../../../assets/characters/3d/agent-k/Agent-K.glb', import.meta.url).href;
    const { scene: model } = await new GLTFLoader().loadAsync(url);
    model.name = 'cipher-agent-k';
    // Same body units as Somangi; the crystal is additional height.
    model.scale.setScalar(LOBBY.agentK.bodyHeight / 1.95);
    model.updateMatrixWorld(true);
    const ground = new THREE.Box3().setFromObject(model).min.y;
    model.position.set(LOBBY.agentK.x, -ground, LOBBY.agentK.z);
    model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;
    });
    room.add(model);
    return model;
}
