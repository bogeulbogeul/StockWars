import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan, migrateClothingTour } from '../js/app/exhibition/Plan.js';
import { TOWN_MODEL_BUILDINGS } from '../js/data/townModelBuildings.js';
import { TOWN_BUILDINGS } from '../js/data/townWorldData.js';
import { villagePathRoutes } from '../js/data/townLandscapeLayout.js';

const chapters = parseChapters(['opening', 'activities-and-ending'].map(name =>
    readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8')).join('\n'));
test('removed clothing store has no building, entrance or tour scenes', () => {
    assert.ok(![...TOWN_BUILDINGS, ...TOWN_MODEL_BUILDINGS].some(b => b.id === 'claire_apparel'));
    assert.ok(villagePathRoutes().flat(2).every(Number.isFinite));
    for (const order of ['packing', 'stock']) {
        assert.ok(!buildPlan(chapters, order).some(s => /보니 옷장|보니의 옷장/.test(s.text || '') || s.place === 'retiredClothing'));
    }
});
test('old tour cursors retain every surviving scene and migration runs once', () => {
    for (const order of ['packing', 'stock']) {
        const old = buildPlan(chapters, order, true), current = buildPlan(chapters, order);
        for (let cursor = 0; cursor < old.length; cursor++) {
            const state = { order, cursor, cash: 1234, flags: { wage: true } };
            migrateClothingTour(state, chapters);
            if (old[cursor].id === 'walk') assert.equal(current[state.cursor].id, 'walk');
            else if (old[cursor].place !== 'retiredClothing') assert.deepEqual(current[state.cursor], old[cursor]);
            const once = structuredClone(state); migrateClothingTour(state, chapters);
            assert.deepEqual(state, once); assert.equal(state.cash, 1234);
        }
    }
});
