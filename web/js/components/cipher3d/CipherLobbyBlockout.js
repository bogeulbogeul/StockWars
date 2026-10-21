import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { addLobbyFixtures } from './CipherLobbyFixtures.js';
import { roundedLobbyBox } from './CipherLobbyArchitecture.js';
import { addCipherLobbyDesk } from './CipherLobbyDesk.js';
import { addCipherLobbyShell } from './CipherLobbyShell.js';
import { addCipherDeskProps } from './CipherDeskProps.js';
import { addCipherSingleSofas } from './CipherSingleSofas.js';
import { addCozyLobbyPlants } from './CipherCozyPlants.js';
import { addLobbyEntry } from './CipherLobbyEntry.js';
import { addCipherEntryMat } from './CipherEntryMat.js';
import { addCipherAgentK } from './CipherAgentK.js';

// Fixed room package: primitive geometry only; no final art or trading features.
export function buildCipherLobby(scene) {
    const room = new THREE.Group();
    room.name = 'cipher-lobby-blockout';
    const materials = new Map();
    const box = (name, size, position, color) => {
        if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .95 }));
        const mesh = new THREE.Mesh(roundedLobbyBox(size), materials.get(color));
        mesh.name = name;
        mesh.position.set(...position);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        room.add(mesh);
        return mesh;
    };
    room.userData.shellReady = addCipherLobbyShell(room);
    room.userData.deskReady = addCipherLobbyDesk(room);
    addCipherDeskProps(room, box);
    addLobbyEntry(room);
    room.userData.entryMatReady = addCipherEntryMat(room);
    room.userData.agentKReady = addCipherAgentK(room);
    room.userData.seatingReady = Promise.all([addCipherSingleSofas(room),addCozyLobbyPlants(room)]);
    room.userData.marketBoard = addLobbyFixtures(room, box);
    scene.add(room);
    return room;
}
