import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from '../vendor/three/three.module.js';
import { workstationGuideRoute } from '../js/components/store3d/BongbongWorkstationGuide.js';
import { VIVIAN_OBSTACLES } from '../js/data/vivianModelRoom.js';
import { GROUND_PROJECTION as P } from '../js/data/townModelBuildings.js';
import { routeLength, routePoint } from '../js/app/exhibition/TourRoute.js';

test('Bongbong walks around the counter to the side of the worktop and leaves its customer side clear', () => {
    const shopkeeper = new Group(); shopkeeper.position.set(-65, 0, 103.75);
    shopkeeper.userData.rigidBody = { radius: 36 };
    const furnitureBodies = VIVIAN_OBSTACLES.map(b => ({ minX: b.minX, maxX: b.maxX, minY: b.minZ * P, maxY: b.maxZ * P }));
    const route = workstationGuideRoute({ shopkeeper, furnitureBodies,
        controller: { charPosX: 0, charPosY: 183.75 * P } },
    { min: { x: 67.5, z: -201 }, max: { x: 225, z: -132 } });
    const end = route.at(-1), z = end.y / P;
    assert(end.x < 67.5 && z < -132); assert(routeLength(route) > 300);
    assert(Math.hypot(end.x - 163, z + 45) > 90);
    for (let d = 0; d <= routeLength(route); d += 2) {
        const point = routePoint(route, d);
        assert(!VIVIAN_OBSTACLES.some(b => point.x > b.minX - 35 && point.x < b.maxX + 35
            && point.y / P > b.minZ - 35 && point.y / P < b.maxZ + 35));
    }
});

for (const [x, z] of [[0, 160], [-120, 160], [-180, 100], [-180, 50]]) {
    test(`accepting beside Bongbong at ${x},${z} still finds a non-overlapping guide route`, () => {
        const shopkeeper = new Group(); shopkeeper.position.set(-65, 0, 103.75);
        shopkeeper.userData.rigidBody = { radius: 33 };
        const route = workstationGuideRoute({ shopkeeper, controller: { charPosX: x, charPosY: z * P },
            furnitureBodies: VIVIAN_OBSTACLES.map(b => ({ minX: b.minX, maxX: b.maxX, minY: b.minZ * P, maxY: b.maxZ * P })) },
        { min: { x: 67.5, z: -201 }, max: { x: 225, z: -132 } });
        assert(route.length >= 2);
        const clearance = Math.min(79, Math.hypot(-65 - x, 103.75 - z) - .5);
        for (let d = 0; d <= routeLength(route); d += 2) {
            const point = routePoint(route, d);
            assert(Math.hypot(point.x - x, point.y / P - z) >= clearance - .1);
        }
        if (x === -180 && z === 50) assert(route.at(-1).y / P > -132, 'use the free front aisle');
    });
}
