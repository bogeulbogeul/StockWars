import test from 'node:test';
import assert from 'node:assert/strict';
import { insideTownBoundary, TOWN_BOUNDARY } from '../js/data/townBoundary.js';
import { installModelPreviewCollision } from '../js/components/town3d/TownModelCollision.js';

test('woodland blocks feet at north and side edges while keeping road open', () => {
    assert.equal(insideTownBoundary(500, 1400), false);
    assert.equal(insideTownBoundary(3020, 1400), false);
    assert.equal(insideTownBoundary(1600, 700), false);
    assert.equal(insideTownBoundary(540, 720), true);
    assert.equal(insideTownBoundary(1000, 2430), true);
});

test('collision wrapper blocks sprint substeps, preserves buildings and legacy mode', () => {
    const previous = globalThis.document;
    let preview = true;
    globalThis.document = { body: { classList: { contains: () => preview } } };
    try {
        const controller = { worldWidth: 3700, worldHeight: 2600, canStand: () => false };
        installModelPreviewCollision(controller, [{ minX: 1000, maxX: 1200, minY: 1000, maxY: 1200 }]);
        assert.equal(controller.canStand(1100, 1100), false);
        assert.equal(controller.canStand(1600, 1400), true);
        let x = 560;
        for (let i = 0; i < 30; i++) if (controller.canStand(x - 8, 1400)) x -= 8;
        assert(x >= TOWN_BOUNDARY.minX + 16);
        assert(x < 560);
        assert.equal(controller.canStand(x - 8, 1400), false);
        assert.equal(controller.canStand(x, 1410), true);
        preview = false;
        assert.equal(controller.canStand(1600, 1400), false);
        assert.equal(controller.canStand(300, 1400), false);
    } finally { globalThis.document = previous; }
});
