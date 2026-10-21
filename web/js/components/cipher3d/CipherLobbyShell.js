import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCipherLobbyShell(room, modelName = 'Cipher-cozy-room') {
    const url = new URL(`../../../assets/office/3d/${modelName}.glb`, import.meta.url).href;
    const { scene: shell } = await new GLTFLoader().loadAsync(url);
    shell.name = 'cipher-cozy-room-shell';
    shell.scale.setScalar(100);
    shell.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = object.receiveShadow = true;
    });
    room.add(shell);
    for (const x of [-310,310]) {
        const lamp = new THREE.PointLight(0xffd19a,2200,220,2);
        lamp.name = 'cipher-warm-wall-light';
        lamp.position.set(x,220,-LOBBY.depth/2+43);
        room.add(lamp);
    }
    return shell;
}
