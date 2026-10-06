import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
let source = fs.readFileSync('web/js/data/inventoryData.js', 'utf8');
for (const file of ['additionalRumors', 'ordinaryRumors', 'rumorBalance']) source = source.replace(`./${file}.js`, url(fs.readFileSync(`web/js/data/${file}.js`, 'utf8')));
const { ITEM_CATALOG_DB, getRandomRumorItem } = await import(url(source));
const rumors = ITEM_CATALOG_DB.filter(item => item.category === 'intel');
assert.equal(rumors.length, 25);
assert.equal(new Set(rumors.map(item => item.id)).size, 25);
let boundary = 0;
for (const [rarity, count, weight, price] of [['common',10,50,500],['uncommon',8,28,1200],['rare',4,15,2000],['epic',2,6,6000],['legendary',1,1,15000]]) {
    const pool = rumors.filter(item => item.rarity === rarity);
    assert.equal(pool.length, count);
    for (let n = 0; n < pool.length; n++) {
        assert.equal(pool[n].price, price);
        const rolls = [boundary / 100, (n + .5) / pool.length];
        const reward = getRandomRumorItem(() => rolls.shift());
        assert.equal(reward.id, pool[n].id);
        reward.isRead = true;
        assert.equal(pool[n].isRead, undefined);
    }
    const rolls = [(boundary + weight - .0001) / 100, 0];
    assert.equal(getRandomRumorItem(() => rolls.shift()).rarity, rarity);
    boundary += weight;
}
assert.equal(boundary, 100);
console.log('PASS: counts, prices, weighted boundaries, all events selectable, independent rewards');
