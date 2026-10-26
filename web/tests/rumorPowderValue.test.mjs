import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AUTHORED_RUMOR_ITEMS } from '../js/data/rumorCatalog.js';

test('successful star/moon powder halves only target current value and persists without changing quiz awards', () => {
    let engine = new ItemEngine({ blackSwanEnabled: false });
    engine.state.inventory.push(...['target', 'other'].map(id => ({ ...structuredClone(AUTHORED_RUMOR_ITEMS[0]),
        id, isRead: true, price: 1600 })));
    engine.add('item_crypto_decoder', 4); engine.add('item_moon_powder');
    engine.state.analysisGrowth.awarded.preserved = { at: 1, amount: 1 };
    const growth = structuredClone(engine.state.analysisGrowth);
    assert.ok(engine.use('item_crypto_decoder', { rumorId: 'target' }).success);
    assert.equal(engine.state.inventory[0].price, 800);
    assert.equal(engine.state.inventory[1].price, 1600);
    assert.ok(engine.use('item_crypto_decoder', { rumorId: 'target' }).success);
    assert.equal(engine.state.inventory[0].price, 400);
    assert.ok(engine.use('item_moon_powder', { rumorId: 'target' }).success);
    assert.equal(engine.state.inventory[0].price, 200);
    assert.equal(engine.state.inventory[0].interpretationLevel, 5);
    assert.deepEqual(engine.state.analysisGrowth, growth);
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)), blackSwanEnabled: false });
    assert.equal(engine.state.inventory[0].price, 200);
    const saved = JSON.stringify(engine.state.inventory);
    assert.equal(engine.use('item_crypto_decoder', { rumorId: 'target' }).success, false);
    assert.equal(JSON.stringify(engine.state.inventory), saved);
});

test('floor never raises cheap saved rumors; unread/invalid targets consume nothing', () => {
    for (const [price, expected] of [[201, 100], [100, 100], [50, 50], [0, 0]]) {
        const engine = new ItemEngine({ blackSwanEnabled: false });
        engine.state.inventory.push({ ...structuredClone(AUTHORED_RUMOR_ITEMS[0]), id: 'target', price, isRead: false });
        engine.add('item_crypto_decoder', 2);
        assert.equal(engine.use('item_crypto_decoder', { rumorId: 'target' }).success, false);
        assert.equal(engine.state.inventory[0].price, price);
        engine.state.inventory[0].isRead = true;
        const before = JSON.stringify(engine.state.inventory);
        assert.equal(engine.use('item_crypto_decoder', { rumorId: 'missing' }).success, false);
        assert.equal(JSON.stringify(engine.state.inventory), before);
        assert.ok(engine.use('item_crypto_decoder', { rumorId: 'target' }).success);
        assert.equal(engine.state.inventory[0].price, expected);
    }
});
