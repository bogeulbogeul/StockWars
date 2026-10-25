import test from 'node:test';
import assert from 'node:assert/strict';
import { shopkeeperGreetingRoute } from '../js/components/store3d/BongbongGreeting.js';
import { VIVIAN_OBSTACLES } from '../js/data/vivianModelRoom.js';
import { routeLength, routePoint } from '../js/app/exhibition/TourRoute.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';

test('Bongbong approaches through the aisle without crossing the counter or displays', () => {
    const furniture = VIVIAN_OBSTACLES.map(b => ({ minX: b.minX, maxX: b.maxX, minY: b.minZ * P, maxY: b.maxZ * P }));
    const route = shopkeeperGreetingRoute({ x: 0, z: -157.5 }, { x: -65, z: 103.75 }, furniture, 36);
    assert(route.some(p => Math.abs(p.x) > 144));
    for (let d = 0; d <= routeLength(route); d += 3) {
        const p = routePoint(route, d), z = p.y / P;
        assert(!VIVIAN_OBSTACLES.some(b => p.x > b.minX - 35 && p.x < b.maxX + 35
            && z > b.minZ - 35 && z < b.maxZ + 35));
    }
});
