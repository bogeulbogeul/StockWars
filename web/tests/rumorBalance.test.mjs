import assert from 'node:assert/strict';
import { ITEM_CATALOG_DB, LEGACY_ITEM_CATALOG_DB, getRandomRumorItem } from '../js/data/inventoryData.js';
import { RUMOR_BALANCE } from '../js/data/rumorBalance.js';
const rumors = ITEM_CATALOG_DB.filter(item => item.category === 'intel');
assert.equal(rumors.length, 288);
assert.equal(LEGACY_ITEM_CATALOG_DB.filter(item => item.category === 'intel').length, 25);
let boundary = 0;
for (const [rarity, { weight, price }] of Object.entries(RUMOR_BALANCE)) {
    const pool = rumors.filter(item => item.rarity === rarity);
    assert.ok(pool.length);
    for (let n = 0; n < pool.length; n++) {
        assert.equal(pool[n].price, price);
        const rolls = [boundary / 100, (n + 0.5) / pool.length];
        const reward = getRandomRumorItem(() => rolls.shift());
        assert.equal(reward.rumorId, pool[n].rumorId);
        assert.notEqual(reward.id, pool[n].id);
        reward.rumorStages[0] = 'independent copy';
        assert.notEqual(pool[n].rumorStages[0], reward.rumorStages[0]);
    }
    boundary += weight;
}
assert.equal(boundary, 100);
console.log('PASS: all 288 awards, original weights/prices, independent instances, legacy preservation');
