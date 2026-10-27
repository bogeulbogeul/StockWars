import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from '../vendor/three/three.module.js';
import { createExteriorDoor } from '../js/components/town3d/ExteriorDoors.js';

test('disabled exterior door hooks preserve closed panels, hinge pins and frames', async t => {
    const callbacks = [];
    const oldRAF = globalThis.requestAnimationFrame, oldDocument = globalThis.document;
    globalThis.requestAnimationFrame = callback => callbacks.push(callback);
    globalThis.document = { hidden: false };
    t.after(() => {
        if (oldRAF === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = oldRAF;
        if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    });
    let now = 0;
    const frames = count => {
        for (let i = 0; i < count; i++) { now += 50; const pending = callbacks.splice(0); pending.forEach(callback => callback(now)); }
    };
    const building = new Group(); building.name = 'node_finance';
    building.position.set(1200, 4, 1700); building.rotation.y = .3; building.scale.setScalar(100);
    const material = new MeshStandardMaterial();
    for (const [i, x] of [-.17, .17].entries()) {
        const leaf = new Mesh(new BoxGeometry(.32, 1, .04), material);
        leaf.name = `Central_Double_Door_Leaf${i || ''}`; leaf.position.set(x, .5, 1); building.add(leaf);
        const handle = new Mesh(new BoxGeometry(.02, .1, .02), material);
        handle.name = `Brass_Door_Handle${i || ''}`; handle.position.set(x / 3, .5, 1.04); building.add(handle);
    }
    const frame = new Mesh(new BoxGeometry(1, 1.2, .05), material); frame.name = 'Door_Continuous_Cream_Arch'; building.add(frame);
    building.updateMatrixWorld(true);
    const originalFrame = frame.matrixWorld.clone();
    const door = createExteriorDoor(building);
    assert.equal(createExteriorDoor(building), door);
    assert.equal(door.panels.length, 2);
    const pins = door.panels.flatMap(panel => panel.pins);
    const before = pins.map(pin => pin.getWorldPosition(new Vector3()));
    const opening = door.open(); frames(6);
    const closing = door.close(); frames(20);
    await Promise.all([opening, closing]);
    assert(door.panels.every(panel => panel.pivot.rotation.y === 0));
    const reopened = door.open(); frames(20); await reopened;
    building.updateMatrixWorld(true);
    assert.deepEqual(frame.matrixWorld.elements, originalFrame.elements);
    pins.forEach((pin, i) => assert(pin.getWorldPosition(new Vector3()).distanceTo(before[i]) < 1e-8));
    assert.equal(door.isOpen, false);
    assert(door.panels.every(panel => panel.pivot.rotation.y === 0));
    assert.equal(callbacks.length, 0);
    assert(door.panels.every(panel => panel.pivot.children.every(mesh => mesh.userData.dynamicDoor)));
});
