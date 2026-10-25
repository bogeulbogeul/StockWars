import test from 'node:test';
import assert from 'node:assert/strict';
import { informationExitRoute } from '../js/app/exhibition/InformationExit.js';
import { INFORMATION_OBSTACLES } from '../js/data/informationObstacles.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';
import { routeLength, routePoint } from '../js/app/exhibition/TourRoute.js';

test('Moa leaves through the aisle beside the desk instead of through furniture', () => {
    const route = informationExitRoute({ x: 0, z: -145 });
    assert.equal(route.at(-1).x, 0);
    assert(Math.abs(route.at(-1).y - 312 * P) < 1e-9);
    assert(route.some(p => Math.abs(p.x) >= 166));
    for (let d = 0; d <= routeLength(route); d += 2) {
        const p = routePoint(route, d), z = p.y / P;
        assert(!INFORMATION_OBSTACLES.some(b => p.x > b.minX - 25 && p.x < b.maxX + 25
            && z > b.minZ - 25 && z < b.maxZ + 25), `blocked at ${p.x},${z}`);
    }
});

test('Moa reserves the waiting player space instead of pushing through it', () => {
    for (const player of [{ x: -125, z: 200 }, { x: 75, z: 100 }, { x: 0, z: 170 }]) {
        const route = informationExitRoute({ x: 0, z: -145 }, player, 95);
        for (let d = 0; d <= routeLength(route); d += 2) {
            const point = routePoint(route, d);
            assert(Math.hypot(point.x - player.x, point.y / P - player.z) >= 94.9);
        }
    }
});
