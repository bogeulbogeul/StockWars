import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, PerspectiveCamera } from '../vendor/three/three.module.js';
import { createConversationCamera } from '../js/components/town3d/ConversationCamera.js';

function setup() {
    const camera = new PerspectiveCamera(35, 1.6, 1, 20000);
    const moa = { root: new Group() }, player = { root: new Group(), town: { playerController: {} } };
    moa.root.position.set(-8, 0, -110); player.storyTarget = moa.root;
    const controller = createConversationCamera();
    const frame = () => {
        camera.position.set(0, 500, 1100); camera.lookAt(0, 0, 0);
        controller.update(camera, player, moa, 1 / 60);
    };
    for (let i = 0; i < 60; i++) frame();
    player.storyTarget = null;
    return { camera, moa, frame };
}

test('leaving a conversation uses its last shot even if Moa walks across the player', () => {
    const still = setup(), moving = setup();
    for (let i = 0; i < 90; i++) {
        moving.moa.root.position.x += 5;
        moving.moa.root.position.z += 2;
        still.frame(); moving.frame();
        assert(still.camera.position.distanceTo(moving.camera.position) < 1e-8, `camera follows departing Moa at frame ${i}`);
        assert(still.camera.quaternion.angleTo(moving.camera.quaternion) < 1e-6);
    }
    assert(still.camera.position.distanceTo({ x: 0, y: 500, z: 1100 }) < 1e-8);
});
