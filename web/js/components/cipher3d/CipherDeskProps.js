import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { LOBBY_COLORS } from './CipherLobbyArchitecture.js';

export function addCipherDeskProps(room, box) {
    const { desk } = LOBBY;
    const { blue, cream, darkBlue } = LOBBY_COLORS;
    const laptop = new THREE.Group();
    laptop.name = 'desk-laptop';
    laptop.position.set(desk.x - 68, desk.height, desk.z);
    room.add(laptop);
    const part = (group, name, size, position, color) => {
        const mesh = box(name, size, position, color);
        group.add(mesh);
        return mesh;
    };
    part(laptop, 'laptop-base', [65, 4, 46], [0, 2, 0], darkBlue);
    part(laptop, 'laptop-keyboard-deck', [57, .8, 29], [0, 4.2, 3], 0x62798c);
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            part(laptop, 'laptop-key', [4, .7, 3], [-23+col*5.7, 5, 10-row*5], cream);
        }
    }
    part(laptop, 'laptop-trackpad', [18, .7, 8], [0, 5, -13], 0xa9b7c2);
    const lid = new THREE.Group();
    lid.name = 'laptop-lid';
    lid.position.set(0, 4, 19);
    lid.rotation.x = .18;
    laptop.add(lid);
    part(lid, 'laptop-lid-back', [65, 40, 3], [0, 20, 0], blue);
    // Staff sits behind the desk (-Z); the visitor sees the lid's outer face.
    const display = new THREE.Mesh(new THREE.PlaneGeometry(57, 32),
        new THREE.MeshBasicMaterial({ color: 0x183146, toneMapped: false }));
    display.name = 'laptop-display';
    display.position.set(0, 20, -1.6);
    display.rotation.y = Math.PI;
    lid.add(display);

    const logo = new THREE.Group();
    logo.name = 'desk-cipher-logo';
    logo.position.set(desk.x, 29, desk.z + desk.depth/2 - 3);
    room.add(logo);
    // Match the exterior emblem proportions: the rising line crosses the last bar.
    for (const [x, height] of [[-25, 8], [-8, 14], [9, 21]]) {
        part(logo, 'cipher-logo-bar', [9, height, 3], [x, height/2-10, 0], cream);
    }
    const stroke = (name, points) => {
        const curve = new THREE.CurvePath();
        for (let i = 1; i < points.length; i++) {
            curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]), new THREE.Vector3(...points[i])));
        }
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 1.5, 6, false),
            new THREE.MeshStandardMaterial({ color: cream, roughness: .85 }));
        mesh.name = name;
        logo.add(mesh);
    };
    stroke('cipher-logo-rise', [[-30, 1, 2], [-10, 10, 2], [6, 7, 2], [30, 18, 2]]);
    stroke('cipher-logo-arrow', [[20, 18, 2], [30, 18, 2], [26, 9, 2]]);
}
