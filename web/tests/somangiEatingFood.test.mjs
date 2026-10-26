import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3, Sphere } from '../vendor/three/three.module.js';
import { hideEmbeddedBread, keepFoodOutsideHead } from '../js/components/town3d/SomangiEatingFood.js';
import { EDIBLE_MODEL_IDS } from '../js/components/town3d/SomangiFoodAssets.js';

test('embedded bread stays hidden while its animation anchor remains available', () => {
    const model = new Group(), bread = new Group(); bread.name = 'bread_Prop'; model.add(bread);
    hideEmbeddedBread(model);
    assert.equal(bread.visible, false);
    assert.equal(model.getObjectByName('bread_Prop'), bread);
});
test('food centers stay in front of and outside the head throughout an approaching path', () => {
    const head = new Sphere(new Vector3(0, 75, 0), 31), forward = new Vector3(0, 0, 1);
    for (let i = 0; i <= 100; i++) {
        const p = new Vector3(12 * Math.sin(i), 50 + i / 3, 28 - i / 2);
        keepFoodOutsideHead(p, head, 15, forward);
        assert(p.distanceTo(head.center) >= 47.19);
        assert(p.z >= 0);
    }
});
test('food IDs select the eight adopted food assets, excluding non-food items', () => {
    assert.equal(EDIBLE_MODEL_IDS.length, 8);
    assert(EDIBLE_MODEL_IDS.includes('item_honey_cookie'));
    assert(EDIBLE_MODEL_IDS.includes('item_dew_jelly'));
    assert(!EDIBLE_MODEL_IDS.includes('item_premium_rumor'));
});
