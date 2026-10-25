import test from 'node:test';
import assert from 'node:assert/strict';
import { bankExitRoute } from '../js/app/exhibition/BankExit.js';
import { bankCanStand } from '../js/data/bankModelRoom.js';
import { routeLength, routePoint } from '../js/app/exhibition/TourRoute.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

test('Moa clears the waiting player on her way from the bank counter to the exit', () => {
    const visitor = { x: 0, z: 160 };
    const route = bankExitRoute({ x: 120, z: 115 }, visitor);
    for (let d = 0; d <= routeLength(route); d += 3) {
        const p = routePoint(route, d), z = p.y / P;
        assert(bankCanStand(p.x, z));
        assert(Math.hypot(p.x - visitor.x, z - visitor.z) >= 94);
    }
    assert(Math.abs(route.at(-1).y / P - 312) < 1e-9);
});
