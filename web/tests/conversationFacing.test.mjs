import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Bone, PerspectiveCamera } from '../vendor/three/three.module.js';
import { faceConversationPartner, conversationYaw } from '../js/components/town3d/ConversationFacing.js';
import { createConversationCamera } from '../js/components/town3d/ConversationCamera.js';

test('partners face each other across scaled room parents, without camera overrides', () => {
    const world = new Group(), room = new Group(), resident = new Group(), root = new Group();
    world.add(room, root); room.scale.setScalar(75); room.add(resident);
    resident.position.set(1, 0, -1); root.position.set(-40, 0, 100);
    faceConversationPartner(root, resident); faceConversationPartner(resident, root);
    const yaws = [root.rotation.y, resident.rotation.y];
    assert.equal(yaws[0], conversationYaw(root, resident));
    assert.equal(yaws[1], conversationYaw(resident, root));
    const camera = new PerspectiveCamera(35, 1.6), rig = createConversationCamera({ worldCoordinates: true });
    const player = { root, storyTarget: resident, town: { playerController: {} } };
    for (let i = 0; i < 60; i++) rig.update(camera, player, { root: resident }, 1 / 60);
    assert.deepEqual([root.rotation.y, resident.rotation.y], yaws);
});
test('seated partner only turns head; sleeping partner stays still', () => {
    const root = new Group(), head = new Bone(), target = new Group();
    head.name = 'Head'; root.add(head); root.userData.seated = true;
    target.position.set(50, 0, 100);
    faceConversationPartner(root, target);
    assert.equal(root.rotation.y, 0); assert(head.rotation.y > 0);
    const pose = head.quaternion.clone(); root.userData.sleeping = true;
    target.position.x = -50; faceConversationPartner(root, target);
    assert(head.quaternion.equals(pose));
});
test('baked seated asset keeps its contact position and scale while facing partner', () => {
    const root = new Group(), target = new Group(); root.userData.seated = true;
    root.position.set(0, 64, -103); target.position.set(40, 0, 160);
    const position = root.position.clone(), scale = root.scale.clone();
    faceConversationPartner(root, target);
    assert.equal(root.rotation.y, conversationYaw(root, target));
    assert(root.position.equals(position)); assert(root.scale.equals(scale));
});
