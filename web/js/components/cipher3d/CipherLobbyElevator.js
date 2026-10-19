import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { LOBBY_COLORS } from './CipherLobbyArchitecture.js';

// At the entrance's right-hand side, facing into the room so the fixed camera sees it.
export function addLobbyElevator(room, box) {
    const { cream, blue, darkBlue } = LOBBY_COLORS;
    const group = new THREE.Group();
    group.name = 'entrance-elevator';
    group.position.set(LOBBY.width/2, 0, LOBBY.elevator.z);
    group.rotation.y = -Math.PI/2;
    room.add(group);
    const part = (name, size, position, color) => {
        const mesh = box(`elevator-${name}`, size, position, color);
        group.add(mesh);
        return mesh;
    };
    part('surround', [168, 224, 19], [0, 112, 11], cream);
    part('recess', [142, 194, 7], [0, 97, 24], darkBlue);
    for (const side of [-1, 1]) {
        part('door', [66, 184, 5], [side*34, 93, 30], 0x9bacb9);
        part('door-inlay', [2, 139, 1], [side*48, 98, 33], 0xc8d2d7);
    }
    part('center-seam', [2, 185, 1], [0, 93, 33], darkBlue);
    part('threshold', [158, 3, 34], [0, 1.5, 25], 0x8a9bab);
    part('indicator', [65, 18, 3], [0, 207, 22], darkBlue);
    part('call-panel', [21, 51, 5], [-105, 103, 13], blue);
    const arrow = (name, x, y, z, direction, size, color) => {
        const shape = new THREE.Shape();
        shape.moveTo(-size, -direction*size/2);
        shape.lineTo(size, -direction*size/2);
        shape.lineTo(0, direction*size);
        shape.closePath();
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape),
            new THREE.MeshBasicMaterial({ color, toneMapped: false }));
        mesh.name = name;
        mesh.position.set(x,y,z);
        group.add(mesh);
    };
    for (const [y, direction] of [[115,1],[92,-1]]) {
        part('call-button', [14, 16, 3], [-105,y,17], cream);
        arrow(direction === 1 ? 'elevator-call-up' : 'elevator-call-down', -105,y,18.6,direction,4,darkBlue);
    }
    arrow('elevator-indicator-up', -11,207,23.6,1,5,0xbadbc8);
    part('floor-one', [2.5, 10, 1], [11,207,23.6], cream);
}
