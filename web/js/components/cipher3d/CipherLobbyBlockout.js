import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { addLobbyFixtures } from './CipherLobbyFixtures.js';
import { roundedLobbyBox, LOBBY_COLORS, addLobbySideWall } from './CipherLobbyArchitecture.js';
import { addCipherDeskProps } from './CipherDeskProps.js';
import { addLobbyElevator } from './CipherLobbyElevator.js';
import { addLobbySeating } from './CipherLobbySeating.js';
import { addLobbyEntry } from './CipherLobbyEntry.js';
import { addCipherEntryMat } from './CipherEntryMat.js';

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
    const { width: w, depth: d, wallHeight: h, desk } = LOBBY;
    box('floor', [w, 14, d], [0, -7, 0], 0xe3dac8);
    // The ceiling and front wall are intentionally open to the fixed camera.
    box('back-wall', [w + 24, h, 16], [0, h / 2, -d / 2 - 8], 0xe7e1d3);
    const { blue, cream } = LOBBY_COLORS;
    box('back-skirting', [w, 36, 12], [0, 18, -d / 2 + 6], blue);
    for (const side of [-1, 1]) {
        const doorZ = LOBBY.doors.find(door => door.wall === (side < 0 ? 'left' : 'right')).z;
        addLobbySideWall(room, side, doorZ, w, d, h);
        // Clear the full ivory arch (outer radius 76 + bevel), not just the doorway.
        for (const [start,end] of [[-d/2,doorZ-79],[doorZ+79,d/2]]) {
            box('side-skirting', [12, 36, end-start], [side*(w/2-6), 18, (start+end)/2], blue);
        }
        box('corner-pilaster', [30, h, 30], [side*(w/2-16), h/2, -d/2+16], cream);
        box('corner-capital', [42, 22, 42], [side*(w/2-16), h-16, -d/2+16], cream);
    }
    box('back-cornice', [w, 20, 23], [0, h-15, -d/2+10], cream);
    // Subtle floor seams keep depth and walking distances readable.
    for (let x = -400; x <= 400; x += 100) box('floor-seam', [1, .3, d], [x, .15, 0], 0xaaa99e);
    for (let z = -280; z <= 320; z += 100) box('floor-seam', [w, .3, 1], [0, .15, z], 0xaaa99e);
    box('desk-body', [desk.width - 12, desk.height - 10, desk.depth - 10],
        [desk.x, (desk.height - 10) / 2, desk.z], blue);
    box('desk-top', [desk.width, 10, desk.depth], [desk.x, desk.height - 5, desk.z], 0xede1c4);
    addCipherDeskProps(room, box);
    addLobbyEntry(room);
    room.userData.entryMatReady = addCipherEntryMat(room);
    addLobbyElevator(room, box);
    addLobbySeating(room, box);
    room.userData.marketBoard = addLobbyFixtures(room, box);
    scene.add(room);
    return room;
}
