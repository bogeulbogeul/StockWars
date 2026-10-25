import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Bone, PerspectiveCamera, Vector3 } from '../vendor/three/three.module.js';
import { createInformationHandoffCamera } from '../js/components/information3d/InformationHandoffCamera.js';

test('phone two-shot keeps seated actors fixed, fits both heads and restores the room view', () => {
    const room = new Group(), player = { root: new Group() }, moa = { root: new Group() };
    room.add(player.root, moa.root); room.userData.moa = moa;
    for (const root of [player.root, moa.root]) {
        const head = new Bone(); head.name = 'Head'; head.position.y = 90;
        root.add(head); root.userData.seated = true;
    }
    player.root.position.z = 140; player.root.rotation.y = Math.PI; moa.root.position.z = -140;
    const positions = [player.root.position.clone(), moa.root.position.clone()];
    const camera = new PerspectiveCamera(36, 1.6, 1, 6000);
    camera.position.set(0, 700, 1000); camera.lookAt(0, 90, 0);
    const base = camera.position.clone(), rotation = camera.quaternion.clone();
    const rig = createInformationHandoffCamera(room); rig.setBase(camera);
    room.userData.phoneHandoffActive = true;
    for (let i = 0; i < 60; i++) rig.update(camera, player, 1 / 60);
    camera.updateMatrixWorld(true); room.updateMatrixWorld(true);
    [player.root, moa.root].forEach((root, i) => {
        assert(root.position.equals(positions[i]));
        const face = root.getObjectByName('Head').getWorldPosition(new Vector3()).project(camera);
        assert(Math.abs(face.x) < .85 && Math.abs(face.y) < .8);
    });
    assert.equal(player.root.rotation.y, Math.PI); assert.equal(moa.root.rotation.y, 0);
    room.userData.phoneHandoffActive = false;
    for (let i = 0; i < 60; i++) rig.update(camera, player, 1 / 60);
    assert(camera.position.distanceTo(base) < 1e-8);
    assert(camera.quaternion.angleTo(rotation) < 1e-6);
    assert.equal(player.root.userData.conversationOpenCamera, null);
});
