import test from 'node:test';
import assert from 'node:assert/strict';
import { roomWalkingRoute, walkRoomTo, roomExitPoint } from '../js/app/OnFootNavigation.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';
import { clearTourSegment, tourDistance } from '../js/app/exhibition/TourRoute.js';

const legal = (x, z) => Math.abs(x) <= 300 && Math.abs(z) <= 300
    && !(Math.abs(x) < 45 && Math.abs(z) < 110);
function scene() {
    const c = { charPosX: -170, charPosY: -30 * P, keysHeld: new Set(), isMoving: false };
    return { controller: c, canStand: legal, ready: Promise.resolve(),
        player: { update() {}, setState() {} }, seatInteraction: { stand: () => true } };
}
test('indoor routes support negative coordinates and go around furniture', () => {
    const s = scene(), route = roomWalkingRoute(s, { x: 170, z: -30 });
    assert.equal(route[0].x, -170); assert(Math.abs(route[0].y + 30 * P) < 1e-10);
    assert(Math.abs(route.at(-1).x - 170) < .001);
    assert(route.length > 2);
    for (let i = 1; i < route.length; i++) assert(clearTourSegment(route[i - 1], route[i], (x, y) => legal(x, y / P)));
});
test('exit travel advances by walking frames, clears facing and stops at the end', async () => {
    const originalRAF = globalThis.requestAnimationFrame, originalDocument = globalThis.document;
    let time = 0; globalThis.document = { hidden: false };
    globalThis.requestAnimationFrame = callback => setImmediate(() => callback(time += 16));
    try {
        const s = scene(), frames = []; s.player.storyTarget = {};
        s.player.update = () => frames.push({ x: s.controller.charPosX, y: s.controller.charPosY });
        await walkRoomTo(s, { x: 170, z: -30 });
        assert(frames.length > 100);
        for (let i = 1; i < frames.length; i++) assert(tourDistance(frames[i - 1], frames[i]) <= 2.321);
        assert.equal(s.player.storyTarget, null); assert.equal(s.controller.scriptedWalking, false);
        assert.equal(s.controller.isMoving, false); assert.equal(s.controller.charPosX, 170);
    } finally { globalThis.requestAnimationFrame = originalRAF; globalThis.document = originalDocument; }
});
test('every connected building has its own interior exit threshold', () => {
    for (const id of ['home_office_tower', 'vivian_store', 'settlement_information', 'node_finance', 'cipher_securities']) {
        const destination = roomExitPoint({ layout: { exitZ: 316 } }, id);
        assert(Number.isFinite(destination.x)); assert(destination.z > 250);
    }
});
