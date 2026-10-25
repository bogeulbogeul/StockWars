import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from '../vendor/three/three.module.js';
import { walkPlayerIntoInformation } from '../js/app/exhibition/InformationPlayerEntry.js';
import { walkMoaThroughDoor } from '../js/app/exhibition/DoorwayMoaWalk.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

test('player and Moa keep their original opaque materials throughout the doorway walk', async t => {
    const frames = [], oldRAF = globalThis.requestAnimationFrame, oldDocument = globalThis.document;
    globalThis.requestAnimationFrame = callback => frames.push(callback);
    globalThis.document = { hidden: false };
    t.after(() => {
        if (oldRAF === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = oldRAF;
        if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    });
    const root = new Group(), materials = [new MeshStandardMaterial(), new MeshStandardMaterial()];
    const mesh = new Mesh(new BoxGeometry(), materials); root.add(mesh);
    const controller = { charPosX: 500, charPosY: 1100 * P, sceneryCanStand: () => true, keysHeld: new Set() };
    const door = { center: { x: 500, z: 1000 }, width: 100, floorY: 20 };
    let now = 0;
    const check = () => {
        assert.equal(mesh.material, materials);
        for (const material of materials) { assert.equal(material.opacity, 1); assert.equal(material.transparent, false); assert.equal(material.depthWrite, true); }
    };
    const flush = () => {
        let count = 0;
        while (frames.length) {
            assert(++count < 200);
            now += 50;
            for (const callback of frames.splice(0)) { callback(now); check(); }
        }
        assert(count > 10);
    };
    const player = { root, town: { playerController: controller }, setState: () => {} };
    const walking = walkPlayerIntoInformation(player, door); check(); flush(); await walking;
    assert.equal(controller.scriptedWalking, false); assert.equal(controller.charPosY, 990 * P); check();
    root.position.set(500, 0, 1100);
    const action = { reset() { return this; }, play() {}, stop() {} };
    const moa = { root, animations: [{ name: 'Walk_InPlace' }], mixer: { clipAction: () => action } };
    controller.charPosX = 650;
    const moaWalking = walkMoaThroughDoor(moa, door, controller); check(); flush(); await moaWalking;
    check(); assert.equal(root.position.z, 990); assert.equal(root.visible, false);
});
