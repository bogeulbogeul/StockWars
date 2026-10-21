import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCipherEntryMat(room) {
    const url = new URL('../../../assets/office/3d/Cipher-entry-mat.glb', import.meta.url).href;
    const { scene: mat } = await new GLTFLoader().loadAsync(url);
    mat.name = 'cipher-entry-logo-mat';
    mat.scale.setScalar(220/1.8);
    mat.position.set(0,.05,LOBBY.depth/2-78);
    mat.traverse(object => {
        if (!object.isMesh) return;
        object.receiveShadow = true;
        object.castShadow = false;
    });
    room.add(mat);
    return mat;
}
