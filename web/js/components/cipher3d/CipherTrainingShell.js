import * as THREE from '../../../vendor/three/three.module.js';
import { addCipherLobbyShell } from './CipherLobbyShell.js';
import { CipherMarketBoard } from './CipherLobbyFixtures.js';
import { addCipherTrainingDesks } from './CipherTrainingDesks.js';
import { addCipherTrainingChairs } from './CipherTrainingChairs.js';
import { addCipherTrainingCabinet } from './CipherTrainingCabinet.js';
import { addCipherTrainingReturnDoor } from './CipherTrainingReturnDoor.js';

export function buildCipherTrainingShell(scene) {
    const room = new THREE.Group();
    room.name = 'cipher-training-shell';
    room.userData.shellReady = addCipherLobbyShell(room, 'Cipher-training-shell');
    room.userData.marketBoard = new CipherMarketBoard(room, undefined, { lesson: true });
    room.userData.deskReady = addCipherTrainingDesks(room);
    room.userData.seatingReady = addCipherTrainingChairs(room);
    room.userData.furnitureReady = addCipherTrainingCabinet(room);
    room.userData.doorsReady = addCipherTrainingReturnDoor(room);
    scene.add(room);
    return room;
}
