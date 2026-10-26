import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, PerspectiveCamera, Vector3 } from '../vendor/three/three.module.js';
import { createConversationCamera } from '../js/components/town3d/ConversationCamera.js';
import { HomeRoomCamera } from '../js/components/home3d/HomeRoomCamera.js';

for (const aspect of [1.6, .5]) test(`home dialogue shows both faces without moving their positions at aspect ${aspect}`, () => {
    const camera = new PerspectiveCamera(24, aspect, 1, 5000);
    const moa = { root: new Group() }, player = { root: new Group(), town: { playerController: {} } };
    player.root.position.set(6.11, 0, 188.5); moa.root.position.set(110, 0, -60); player.storyTarget = moa.root;
    const rig = createConversationCamera({ fitWidth: true });
    for (let i = 0; i < 90; i++) {
        camera.position.set(0, 720, 1100); camera.lookAt(0, 78, 20);
        player.root.rotation.y = Math.atan2(103.89, -248.5);
        moa.root.rotation.y = Math.atan2(-103.89, 248.5);
        rig.update(camera, player, moa, 1 / 60);
    }
    camera.updateMatrixWorld(true);
    for (const actor of [player.root, moa.root]) {
        const face = actor.position.clone().add(new Vector3(0, 80, 0)).project(camera);
        assert(Math.abs(face.x) < .9 && face.y > -.25 && face.y < .9);
    }
    assert.deepEqual(player.root.position.toArray(), [6.11, 0, 188.5]);
    assert.deepEqual(moa.root.position.toArray(), [110, 0, -60]);
});
test('home cutaway follows the actual dialogue camera rather than the movement camera', () => {
    const room = new Group();
    for (const name of ['Wall_Front', 'Wall_Back', 'Wall_Right', 'Wall_Left']) {
        const wall = new Group(); wall.name = name; room.add(wall);
    }
    new HomeRoomCamera(new PerspectiveCamera()).updateWalls(room, 1.1);
    assert.equal(room.getObjectByName('Wall_Right').visible, false);
    assert.equal(room.getObjectByName('Wall_Front').visible, false);
    assert.equal(room.getObjectByName('Wall_Back').visible, true);
});
