import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';

export async function addCozyLobbyElevator(room) {
    const url = new URL('../../../assets/office/3d/Cipher-cozy-elevator.glb',import.meta.url).href;
    const { scene: elevator } = await new GLTFLoader().loadAsync(url);
    elevator.name = 'entrance-elevator';
    elevator.scale.setScalar(100);
    elevator.position.set(LOBBY.width/2,0,LOBBY.elevator.z);
    elevator.rotation.y = -Math.PI/2;
    elevator.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = object.receiveShadow = true;
    });
    room.add(elevator);
    return elevator;
}
