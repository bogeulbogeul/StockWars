import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
const engine = new ItemEngine({ clock: () => 1000, market: {} });
engine.tick = () => {};
engine.state.inventory = [{ id: 'item_crypto_decoder', quantity: 5 }, { id: 'rumor', category: 'intel', targetStockId: 'CLOUDBERRY', isRead: false }];
assert.equal(engine.use('item_crypto_decoder').success, false);
assert.equal(engine.state.inventory[0].quantity, 5);
engine.state.inventory[1].isRead = true;
for (let level = 2; level <= 5; level++) {
    assert.equal(engine.use('item_crypto_decoder').success, true);
    assert.equal(engine.state.inventory[1].interpretationLevel, level);
    assert.equal(engine.stats().analysis, 1);
}
assert.equal(engine.use('item_crypto_decoder').success, false);
assert.equal(engine.state.inventory[0].quantity, 1);
console.log('PASS: unread/capped targets do not consume; four uses persist stages; analysis unchanged');
engine.market.stocks = new Map([['CLOUDBERRY', { id: 'CLOUDBERRY', name: '베리클라우드', sector: 'IT' }]]);
engine.state.inventory.push({ id: 'item_premium_rumor', quantity: 1 });
const paid = engine.use('item_premium_rumor');
assert.equal(paid.success, true);
const rumor = engine.state.inventory.find(item => item.id === paid.rumorId);
assert.equal(rumor.interpretationLevel, 1);
assert.equal(rumor.isRead, true);
assert.equal(rumor.rumorStages.length, 10);
assert.ok(!rumor.rumorStages[2].includes('베리클라우드'));
assert.ok(engine.decoderTargets().includes(rumor));
assert.equal(engine.state.reports.length, 0);
console.log('PASS: premium rumor creation, scheduled event, decoder target');
