import test from 'node:test';
import assert from 'node:assert/strict';
import { doorwayRoute, doorwayHeight } from '../js/app/exhibition/DoorwayTraversal.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

const door = { center: { x: 500, z: 1000 }, floorY: 28, width: 90 };
test('diagonal approaches align outside the jamb before crossing the doorway', () => {
    const route = doorwayRoute({ x: 570, y: 1180 * P }, door, () => true);
    assert.deepEqual(route.at(-2), { x: 500, y: 1100 * P });
    assert.deepEqual(route.at(-1), { x: 500, y: 990 * P });
    assert.equal(doorwayHeight(door, 1150), 0);
    assert.equal(doorwayHeight(door, 1000), 28);
    assert(doorwayHeight(door, 1075) > 0);
});
test('a wide bank stair footprint uses an approach outside its blocked edge', () => {
    const bank = { ...door, approachDistance: 180 };
    const route = doorwayRoute({ x: 500, y: 1300 * P }, bank, (x, y) => y / P > 1140);
    assert(Math.abs(route.at(-2).y / P - 1180) < 1e-9);
    assert.equal(route.at(-1).x, 500);
});
test('after opening the door up close, the player continues inward without backing out', () => {
    const start = { x: door.center.x, y: (door.center.z + 55) * P };
    const route = doorwayRoute(start, { ...door, approachDistance: 180 }, () => false);
    assert.equal(route.length, 2);
    assert.deepEqual(route[0], start);
    assert(route[1].y < route[0].y);
});
