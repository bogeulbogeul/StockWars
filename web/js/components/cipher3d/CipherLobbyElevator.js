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
    // Slim separate jambs replace the old solid white backing slab.
    part('recess', [140, 194, 5], [0, 97, 6], darkBlue);
    for (const side of [-1, 1]) {
        part('jamb', [12, 200, 22], [side*75, 100, 14], blue);
        part('inner-trim', [3, 188, 4], [side*66, 95, 18], cream);
        part('door', [62, 184, 5], [side*32, 94, 12], 0xb8c5cd);
        part('door-edge', [2, 179, 1], [side*3, 94, 15], 0x8d9fae);
    }
    part('header', [162, 34, 22], [0, 207, 14], blue);
    part('header-accent', [122, 2, 2], [0, 192, 26], cream);
    part('center-seam', [2, 183, 1], [0, 94, 15], darkBlue);
    part('threshold', [152, 3, 24], [0, 1.5, 12], 0x8d9fae);
    part('threshold-track', [127, 1, 2], [0, 3.1, 16], darkBlue);
    part('indicator', [58, 21, 3], [0, 208, 26], darkBlue);
    // Place the controls on the entrance side, visible past the door frame.
    part('call-panel', [24, 58, 6], [104, 112, 8], blue);
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
    for (const [y, direction] of [[125,1],[100,-1]]) {
        const button = new THREE.Mesh(new THREE.CylinderGeometry(8,8,3,24),
            new THREE.MeshStandardMaterial({ color:cream,roughness:.8 }));
        button.name = direction === 1 ? 'elevator-up-button' : 'elevator-down-button';
        button.rotation.x = Math.PI/2;
        button.position.set(104,y,13);
        group.add(button);
        arrow(direction === 1 ? 'elevator-call-up' : 'elevator-call-down', 104,y,14.6,direction,4,darkBlue);
    }
    arrow('elevator-indicator-up', -11,208,27.6,1,5,0xbadbc8);
    part('floor-one', [3, 12, 1], [10,208,27.6], cream);
}
