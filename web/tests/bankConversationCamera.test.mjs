import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, PerspectiveCamera, Vector3 } from '../vendor/three/three.module.js';
import { createBankConversationCamera } from '../js/components/bank3d/BankConversationCamera.js';

for (const aspect of [1.6, .5]) test(`bank framing preserves conversation facing at aspect ${aspect}`, () => {
    const camera = new PerspectiveCamera(36, aspect, 1, 6000);
    camera.position.set(0, 700, 1000); camera.lookAt(0, 95, 0);
    const moa = { root: new Group() }, chagok = new Group();
    moa.root.position.set(120, 0, 115); chagok.position.set(0, 64, -103);
    const player = { root: new Group(), storyTarget: chagok, town: { playerController: {} } };
    player.root.position.set(0, 0, 160);
    const room = { userData: { moa, chagok } }, rig = createBankConversationCamera(room);
    rig.setBase(camera);
    for (let i = 0; i < 90; i++) {
        player.root.rotation.y = Math.PI; moa.root.rotation.y = Math.atan2(-120, 45);
        rig.update(camera, player, 1 / 60, true);
    }
    camera.updateMatrixWorld(true);
    for (const root of [player.root, moa.root, chagok]) {
        const face = root.position.clone().add(new Vector3(0, 80, 0)).project(camera);
        assert(Math.abs(face.x) < .9 && face.y > -.25 && face.y < .9);
    }
    assert.equal(player.root.rotation.y, Math.PI);
    assert.equal(moa.root.rotation.y, Math.atan2(-120, 45));
    assert.equal(chagok.rotation.y, 0);
});
