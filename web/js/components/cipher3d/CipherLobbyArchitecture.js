import * as THREE from '../../../vendor/three/three.module.js';

export const LOBBY_COLORS = { ivory: 0xe5dfd1, cream: 0xf3ead9, blue: 0x315c80, darkBlue: 0x243e59 };

export function roundedLobbyBox(size) {
    const [w, h, d] = size;
    const r = Math.min(7, w / 5, h / 5, d / 5);
    const shape = new THREE.Shape();
    shape.moveTo(-w/2+r, -h/2+r);
    shape.lineTo(w/2-r, -h/2+r);
    shape.lineTo(w/2-r, h/2-r);
    shape.lineTo(-w/2+r, h/2-r);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d-2*r,
        bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, steps: 1 });
    geometry.translate(0, 0, -d/2+r);
    return geometry;
}

function arch(radius, spring) {
    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);
    shape.lineTo(radius, spring);
    shape.absarc(0, spring, radius, 0, Math.PI, false);
    shape.lineTo(-radius, 0);
    return shape;
}

export function addArchedLobbyDoor(assembly, id, box) {
    const { cream, blue, darkBlue } = LOBBY_COLORS;
    const material = color => new THREE.MeshStandardMaterial({ color, roughness: .85 });
    const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(arch(62, 114), {
        depth: 7, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 3, steps: 1
    }), material(blue));
    panel.name = `door-${id}-panel`;
    panel.position.z = -10;
    panel.castShadow = panel.receiveShadow = true;
    assembly.add(panel);
    const frameShape = new THREE.Shape();
    // Preserve the adopted slim ivory arch, without a rectangular wall surround.
    frameShape.moveTo(-76, 0);
    frameShape.lineTo(-64, 0);
    frameShape.lineTo(-64, 114);
    frameShape.absarc(0, 114, 64, Math.PI, 0, true);
    frameShape.lineTo(64, 0);
    frameShape.lineTo(76, 0);
    frameShape.lineTo(76, 114);
    frameShape.absarc(0, 114, 76, 0, Math.PI, false);
    frameShape.closePath();
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape, {
        depth: 10, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 3, steps: 1
    }), material(cream));
    frame.name = `door-${id}-frame`;
    frame.position.z = 0;
    frame.castShadow = frame.receiveShadow = true;
    assembly.add(frame);
    const recess = new THREE.Mesh(new THREE.ExtrudeGeometry(arch(65, 114), {
        depth: 4, bevelEnabled: false, steps: 1
    }), material(darkBlue));
    recess.name = `door-${id}-recess`;
    recess.position.z = -13;
    assembly.add(recess);
    const part = (name, size, position, color) => {
        const mesh = box(`door-${id}-${name}`, size, position, color);
        assembly.add(mesh);
    };
    part('center-seam', [1.2, 170, 1], [0, 86, 0], darkBlue);
    for (const side of [-1, 1]) {
        part('handle', [5, 22, 5], [side*10, 74, 3], cream);
    }
    part('threshold', [132, 2, 20], [0, 1, -2], darkBlue);
}

export function addLobbySideWall(room, side, doorZ, width, depth, height) {
    const u = -side * doorZ;
    const shape = new THREE.Shape();
    shape.moveTo(-depth/2, 0);
    shape.lineTo(u-66, 0);
    shape.lineTo(u-66, 114);
    shape.absarc(u, 114, 66, Math.PI, 0, true);
    shape.lineTo(u+66, 0);
    shape.lineTo(depth/2, 0);
    shape.lineTo(depth/2, height);
    shape.lineTo(-depth/2, height);
    shape.closePath();
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
        depth: 16, bevelEnabled: false, steps: 1
    }), new THREE.MeshStandardMaterial({ color: 0xd8d3c6, roughness: .95 }));
    wall.name = side < 0 ? 'left-wall' : 'right-wall';
    wall.rotation.y = side*Math.PI/2;
    wall.position.x = side*width/2;
    wall.castShadow = wall.receiveShadow = true;
    room.add(wall);
}
