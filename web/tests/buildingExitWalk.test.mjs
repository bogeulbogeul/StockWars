import test from 'node:test';
import assert from 'node:assert/strict';
import {Group, Mesh, BoxGeometry, MeshBasicMaterial} from '../vendor/three/three.module.js';
import {leaveBuildingOnFoot} from '../js/app/OnFootNavigation.js';
import {TOWN_MODEL_BUILDINGS} from '../js/data/townModelBuildings.js';

function setup(t, {stand = true, accepted = true} = {}) {
    const events = [], previous = globalThis.document;
    let cover;
    globalThis.document = {
        createElement() {
            cover = {style: {}, animate(frames) {
                events.push(frames[1].opacity === 1 ? 'covered' : 'revealed');
                return {finished: Promise.resolve()};
            }, remove() {events.push('removed');}};
            return cover;
        },
        body: {append() {events.push('cover-added');}}
    };
    t.after(() => {if (previous === undefined) delete globalThis.document; else globalThis.document = previous;});
    const c = {charPosX: 0, charPosY: 0, keysHeld: new Set(['w']), isMoving: true,
        scriptedWalking: true, scriptedSupportHeight: 20};
    const root = new Group(), material = new MeshBasicMaterial();
    root.add(new Mesh(new BoxGeometry(), material)); root.visible = false;
    const town = {town: {playerController: c}, entryActive: true, ready: Promise.resolve(),
        player: {root, ready: Promise.resolve(), update() {
            assert(events.includes('covered')); events.push('positioned');
        }, setState(state) {assert.equal(state, 'idle');}}};
    const room = {seatInteraction: {stand() {events.push('stand'); return stand;}}, hide() {events.push('hidden');}};
    const run = () => leaveBuildingOnFoot({room, town, id: 'home_office_tower', showTown() {
        assert(events.includes('covered')); assert(room.doorTravelActive);
        events.push('shown'); return accepted;
    }});
    return {run, room, town, c, root, material, events};
}
test('exit fades to the current exterior position and releases input without door animation', async t => {
    const state = setup(t), pending = state.run();
    assert.equal(state.room.doorTravelActive, true);
    await state.run(); // Duplicate exit must not create a second transition.
    await pending;
    assert.deepEqual(state.events, ['stand', 'cover-added', 'covered', 'positioned', 'shown', 'hidden', 'revealed', 'removed']);
    const home = TOWN_MODEL_BUILDINGS.find(b => b.id === 'home_office_tower');
    assert.equal(state.c.charPosX, home.x + (home.entranceOffsetX || 0));
    assert.equal(state.c.charPosY, home.y + 110);
    assert.equal(state.c.keysHeld.size, 0); assert.equal(state.c.isMoving, false);
    assert.equal(state.c.scriptedWalking, false); assert.equal(state.c.facing, 'down');
    assert.equal(state.c.scriptedSupportHeight, undefined);
    assert.equal(state.root.visible, true); assert.equal(state.material.opacity, 1);
    assert.equal(state.material.transparent, false);
    assert.equal(state.room.doorTravelActive, false); assert.equal(state.town.entryActive, false);
});
test('a blocked stand aborts exit and clears the travel lock', async t => {
    const state = setup(t, {stand: false});
    await assert.rejects(state.run(), /의자에서 일어날 공간/);
    assert.deepEqual(state.events, ['stand']);
    assert.equal(state.room.doorTravelActive, false); assert.equal(state.town.entryActive, false);
});
test('rejected town display keeps the room visible and removes the fade cover', async t => {
    const state = setup(t, {accepted: false}); await state.run();
    assert(!state.events.includes('hidden')); assert.equal(state.events.at(-1), 'removed');
    assert.equal(state.room.doorTravelActive, false);
});
