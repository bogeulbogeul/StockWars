import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from '../vendor/three/three.module.js';
import { createInformationDoor } from '../js/app/exhibition/InformationDoor.js';

test('all primitives of a grouped house door follow its right hinge', () => {
    const building = new Group(), panel = new Group(); panel.name = 'Home_Arched_Wood_Door';
    const parts = [0, 1].map(i => {
        const mesh = new Mesh(new BoxGeometry(30, 100, 3), new MeshBasicMaterial());
        mesh.position.set(i * 30, 50, 10); panel.add(mesh); return mesh;
    });
    const hinge = new Group(); hinge.name = 'Home_Door_Brass_Hinge'; hinge.position.set(43, 25, 12);
    building.add(panel, hinge);
    const door = createInformationDoor(building, { id: 'home', panelName: panel.name, hingeName: hinge.name });
    const pivot = building.getObjectByName('home-opening-door');
    assert.deepEqual(pivot.position.toArray(), [43, 25, 12]);
    for (const mesh of parts) { assert.equal(mesh.parent, pivot); assert(mesh.userData.dynamicDoor); }
    const dark = building.getObjectByName('home-door-dark-interior');
    assert(dark.isMesh);
    assert.equal(dark.material.color.getHex(), 0);
    assert.equal(dark.material.depthTest, true);
    assert.equal(dark.visible, false);
    assert.equal(door.width, 60);
});
