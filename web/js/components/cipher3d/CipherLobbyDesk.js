import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCipherLobbyDesk(room) {
    const url = new URL('../../../assets/office/3d/Cipher-cozy-desk.glb', import.meta.url).href;
    const { scene: desk } = await new GLTFLoader().loadAsync(url);
    desk.name = 'cipher-cozy-desk';
    desk.scale.setScalar(100);
    desk.position.set(LOBBY.desk.x,0,LOBBY.desk.z);
    desk.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = object.receiveShadow = true;
    });
    room.add(desk);
    return desk;
}
