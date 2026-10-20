import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCipherIndexBoardFrame(room) {
    const url = new URL('../../../assets/office/3d/Cipher-cozy-index-board.glb',import.meta.url).href;
    const { scene: frame } = await new GLTFLoader().loadAsync(url);
    frame.name = 'market-board-frame';
    frame.scale.setScalar(100);
    frame.position.set(0,190,-LOBBY.depth/2+8);
    frame.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = object.receiveShadow = true;
    });
    room.add(frame);
    return frame;
}
