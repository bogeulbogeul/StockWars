import { Box3, Vector3 } from '../../../vendor/three/three.module.js';

const NPC_NAMES = new Set(['moa-character', 'tori-character', 'chagok-character', 'bongbong-character']);
// Current scaled/deformed Somangi: sampled walking envelope radius 31.24.
// Round outward to retain a sub-unit clearance without the old 42-unit padding.
export const PLAYER_BODY_RADIUS = 32;
export const PLAYER_BODY_HEIGHT = 102;

// Kinematic NPC bodies follow their current world transforms, including the
// shelter sit/stand animation. NPC poses are never pushed or rewritten.
export function createCharacterBodies(scene) {
    scene.updateMatrixWorld(true);
    const bodies = [];
    scene.traverse(root => {
        if (!NPC_NAMES.has(root.name)) return;
        const bounds = new Box3().setFromObject(root);
        if (bounds.isEmpty()) return;
        const origin = root.getWorldPosition(new Vector3());
        // Cached skinned Box3 centers drift when poses/rotations change. Anchor
        // to the character root and enclose actual deformed vertices instead.
        let radius = 30;
        root.traverse(mesh => {
            if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
            const point = new Vector3();
            for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
                mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
                radius = Math.max(radius, Math.hypot(point.x-origin.x, point.z-origin.z));
            }
        });
        radius = Math.ceil(radius) + 2;
        root.userData.rigidBody = {type:'kinematic', radius};
        bodies.push({root, radius, position:new Vector3()});
    });
    return bodies;
}

export function charactersCanStand(bodies, x, z) {
    return bodies.every(body => {
        if (!body.root.visible) return true;
        body.root.getWorldPosition(body.position);
        return Math.hypot(x - body.position.x, z - body.position.z)
            >= PLAYER_BODY_RADIUS + body.radius;
    });
}
