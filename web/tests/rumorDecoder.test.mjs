import fs from 'node:fs';
import assert from 'node:assert/strict';
// Load engine alone to isolate decoder behavior from the market timer.
const source = fs.readFileSync(new URL('../js/engine/ItemEngine.js', import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '');
const catalog = [{ id: 'item_crypto_decoder', name: '해독기' }, { id: 'item_premium_rumor', name: '유료 찌라시' }];
const { ItemEngine } = await import('data:text/javascript;base64,' + Buffer.from(`const VIVIAN_SHOP_CATALOG=${JSON.stringify(catalog)};\n${source}`).toString('base64'));
const engine = new ItemEngine({ clock: () => 1000, market: {} });
engine.tick = () => {};
engine.state.inventory = [{ id: 'item_crypto_decoder', quantity: 5 }, { id: 'rumor', category: 'intel', targetStockId: 'CLOUDBERRY', isRead: false }];
assert.equal(engine.use('item_crypto_decoder').success, false);
assert.equal(engine.state.inventory[0].quantity, 5);
engine.state.inventory[1].isRead = true;
for (let level = 2; level <= 5; level++) {
    assert.equal(engine.use('item_crypto_decoder').success, true);
    assert.equal(engine.state.inventory[1].interpretationLevel, level);
    assert.equal(engine.stats().analysis, 0);
}
assert.equal(engine.use('item_crypto_decoder').success, false);
assert.equal(engine.state.inventory[0].quantity, 1);
console.log('PASS: unread/capped targets do not consume; four uses persist stages; analysis unchanged');
engine.market.stocks = new Map([['TEST', { id: 'TEST', name: '테스트 기업', sector: 'IT' }]]);
engine.state.inventory.push({ id: 'item_premium_rumor', quantity: 1 });
const paid = engine.use('item_premium_rumor');
assert.equal(paid.success, true);
const rumor = engine.state.inventory.find(item => item.id === paid.rumorId);
assert.equal(rumor.interpretationLevel, 3);
assert.equal(rumor.isRead, true);
assert.equal(rumor.rumorClues.length, 4);
assert.ok(!rumor.rumorClues[2].includes('테스트 기업'));
assert.ok(engine.decoderTargets().includes(rumor));
assert.equal(engine.state.reports.at(-1).stockId, 'TEST');
console.log('PASS: premium rumor creation, scheduled event, decoder target');
