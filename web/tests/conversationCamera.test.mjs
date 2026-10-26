import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, PerspectiveCamera, Vector3 } from '../vendor/three/three.module.js';
import { createConversationCamera } from '../js/components/town3d/ConversationCamera.js';

test('a doorway scene cut clears the old dialogue shot and lens immediately', () => {
    const camera = new PerspectiveCamera(35, 1.6, 1, 20000);
    const moa = { root: new Group() }, player = { root: new Group(), town: { playerController: {} } };
    moa.root.position.set(130, 0, 0); player.storyTarget = moa.root;
    const rig = createConversationCamera({ faceFraming: true });
    for (let i = 0; i < 60; i++) {
        camera.position.set(0, 500, 1100); camera.lookAt(0, 0, 0);
        rig.update(camera, player, moa, 1 / 60);
    }
    assert.notEqual(camera.fov, 35);
    player.storyTarget = null; player.town.playerController.scriptedWalking = true;
    rig.reset(camera); camera.position.set(0, 500, 1100); camera.lookAt(0, 0, 0);
    rig.update(camera, player, moa, 1 / 60);
    assert.equal(camera.fov, 35);
    assert.deepEqual(camera.position.toArray(), [0, 500, 1100]);
});

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

test('outdoor face framing opens both faces without rotating actors and restores walking lens', () => {
    const camera = new PerspectiveCamera(35, 16 / 9, 1, 20000);
    const moa = { root: new Group() }, player = { root: new Group(), town: { playerController: {} } };
    moa.root.position.set(135, 0, -100); player.storyTarget = moa.root;
    player.root.rotation.y = Math.atan2(135, -100); moa.root.rotation.y = player.root.rotation.y + Math.PI;
    const yaw = [player.root.rotation.y, moa.root.rotation.y], rig = createConversationCamera({ faceFraming: true });
    const frame = () => { camera.position.set(0, 500, 1100); camera.lookAt(0, 0, 0); rig.update(camera, player, moa, 1 / 60); };
    for (let i = 0; i < 90; i++) frame();
    camera.updateMatrixWorld(true);
    for (const root of [player.root, moa.root]) {
        const toward = camera.position.clone().sub(root.position); toward.y = 0; toward.normalize();
        assert(new Vector3(0, 0, 1).applyQuaternion(root.quaternion).dot(toward) > .5);
        assert(Math.abs(root.position.clone().add(new Vector3(0, 85, 0)).project(camera).x) < .8);
    }
    assert.deepEqual([player.root.rotation.y, moa.root.rotation.y], yaw);
    const midpoint = player.root.position.clone().add(moa.root.position).multiplyScalar(.5);
    const horizontal = camera.position.clone().sub(midpoint); horizontal.y = 0;
    assert(horizontal.length() >= 130);
    player.storyTarget = null;
    for (let i = 0; i < 90; i++) frame();
    assert.equal(camera.fov, 35);
});
