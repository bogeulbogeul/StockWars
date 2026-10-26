import test from 'node:test';
import assert from 'node:assert/strict';
import { roundTourRoute } from '../js/app/exhibition/TourCurve.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

const route = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 * P }];
test('clear detour corners become a continuous rounded path with the same endpoints', () => {
    const result = roundTourRoute(route, () => true);
    assert(result.length > 10);
    assert.deepEqual(result[0], route[0]);
    assert.deepEqual(result.at(-1), route.at(-1));
    assert(result.some(p => p.x < 100 && p.y > 0));
});
test('a detour curve cannot cut through an occupied inside corner', () => {
    const legal = (x, y) => !(x < 99.9 && y > .1);
    assert.deepEqual(roundTourRoute(route, legal), route);
});
