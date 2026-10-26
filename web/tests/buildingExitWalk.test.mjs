import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from '../vendor/three/three.module.js';
import { leaveBuildingOnFoot } from '../js/app/OnFootNavigation.js';
import { HOME_SPAWN } from '../js/data/homeModelRoom.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

test('exit reveals the opening door, walks an opaque actor out, then closes and unlocks', async t => {
    const queue = [], oldRAF = globalThis.requestAnimationFrame, oldDocument = globalThis.document;
    globalThis.requestAnimationFrame = cb => queue.push(cb); globalThis.document = { hidden: false };
    t.after(() => {
        if (oldRAF === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = oldRAF;
        if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
    });
    const controller = () => ({ charPosX: HOME_SPAWN.x, charPosY: 180 * P, keysHeld: new Set(), facing: 'up' });
    const actor = c => {
        const root = new Group(), material = new MeshBasicMaterial(); root.add(new Mesh(new BoxGeometry(), material));
        return { root, material, ready: Promise.resolve(), setState() {}, update() { root.position.set(c.charPosX, 0, c.charPosY / P); } };
    };
    const indoor = controller(), exterior = controller(), events = [], points = [];
    const room = { controller: indoor, ready: Promise.resolve(), canStand: () => true, exitPending: false,
        hide() { events.push('hide'); }, seatInteraction: { stand: () => true } };
    room.player = actor(indoor);
    const town = { town: { playerController: exterior }, ready: Promise.resolve(), player: actor(exterior) };
    const door = { center: { x: 800, z: 2000 }, floorY: 15,
        async open() { assert(events.includes('show')); assert(town.entryActive); assert.equal(town.player.root.visible, false); events.push('open'); },
        async close() { assert(exterior.charPosY / P >= 2189); events.push('close'); } };
    const building = new Group(); building.homeDoor = door;
    town.scene = { getObjectByName: () => building };
    let done = false, error;
    const promise = leaveBuildingOnFoot({ room, town, id: 'home_office_tower', showTown() { events.push('show'); return true; } })
        .then(() => { done = true; }, e => { error = e; done = true; });
    let now = 0;
    for (let count = 0; !done && count < 500; count++) {
        await Promise.resolve();
        now += 50;
        for (const cb of queue.splice(0)) cb(now);
        if (exterior.scriptedWalking) points.push(exterior.charPosY / P);
        for (const p of [room.player, town.player]) { assert.equal(p.material.opacity, 1); assert.equal(p.material.transparent, false); }
    }
    await promise; if (error) throw error;
    assert(done); assert(events.indexOf('show') < events.indexOf('open'));
    assert(points.length > 10); assert(points.some(z => z < 2000)); assert(points.some(z => z > 2150));
    assert.equal(events.at(-1), 'close'); assert.equal(town.entryActive, false);
    assert.equal(exterior.scriptedWalking, false); assert.equal(room.doorTravelActive, false); assert.equal(room.exitPending, false);
});
