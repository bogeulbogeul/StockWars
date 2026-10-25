import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AUTHORED_RUMOR_ITEMS, drawAuthoredRumor } from '../js/data/rumorCatalog.js';
import { INITIAL_STOCKS } from '../js/data/stocksData.js';
import { ItemEngine, DAY } from '../js/engine/ItemEngine.js';
import { rumorDecryption } from '../js/engine/RumorDecryption.js';
import { InventoryModal } from '../js/components/InventoryModal.js';

test('all 72 companies have four events and all 2880 texts match company manuscripts', () => {
    assert.equal(AUTHORED_RUMOR_ITEMS.length, 288);
    assert.equal(new Set(AUTHORED_RUMOR_ITEMS.map(i => i.id)).size, 288);
    for (const stock of INITIAL_STOCKS) {
        const items = AUTHORED_RUMOR_ITEMS.filter(i => i.targetStockId === stock.id);
        assert.equal(items.length, 4);
        assert.equal(items.filter(i => i.rumorDirection === 'positive').length, 2);
        assert.equal(items.filter(i => i.rumorDirection === 'negative').length, 2);
        const document = fs.readFileSync(items[0].sourceDocument, 'utf8');
        assert.deepEqual(items.flatMap(i => i.rumorStages), [...document.matchAll(/^> (.+)$/gm)].map(m => m[1]));
        for (const item of items) for (let level = 1; level <= 10; level++) {
            const result = rumorDecryption(item.intelReport, item, level);
            assert.equal(result.text, item.rumorStages[level - 1]);
            assert.equal(result.level, level);
            const view = InventoryModal.prototype.getItemPresentation.call({ callbacks: { getAnalysisLevel: () => level } }, { ...item, isRead: true });
            assert.equal(view.desc, result.text);
            assert.ok(!view.name.includes(stock.name));
            if (level < 4) assert.ok(!JSON.stringify(view.effects).includes(stock.name));
        }
    }
});

function fixture() {
    let now = 1000;
    const market = { stocks: new Map(INITIAL_STOCKS.map(s => [s.id, { ...s }])), cash: 100000 };
    const engine = new ItemEngine({ market, clock: () => now, random: () => 0, blackSwanEnabled: false });
    return { engine, market, advance: ms => { now += ms; engine.tick(); } };
}

test('envelopes create independent authored holdings without market events or stat growth', () => {
    const { engine, market, advance } = fixture();
    assert.ok(engine.purchase('item_premium_rumor', 2).success);
    const a = engine.use('item_premium_rumor'), b = engine.use('item_premium_rumor');
    assert.ok(a.success && b.success);
    assert.notEqual(a.rumorId, b.rumorId);
    const first = engine.state.inventory.find(i => i.id === a.rumorId);
    assert.equal(first.rumorStages.length, 10);
    assert.ok(first.isRead);
    assert.equal(first.interpretationLevel, 1);
    assert.equal(engine.state.reports.length, 0);
    assert.equal(engine.stats().analysis, 1);
    const price = market.stocks.get(first.targetStockId).price;
    advance(DAY * 2);
    assert.equal(market.stocks.get(first.targetStockId).price, price);
});

test('powders stop at ten, affect only selected holdings and preserve saves', () => {
    const { engine, market } = fixture();
    engine.state.inventory.push(...['first', 'second'].map(id => ({ ...structuredClone(AUTHORED_RUMOR_ITEMS[0]), id, isRead: true })));
    assert.ok(engine.purchase('item_crypto_decoder', 9).success);
    for (let level = 2; level <= 10; level++) {
        assert.ok(engine.use('item_crypto_decoder', { rumorId: 'first' }).success);
        assert.equal(engine.state.inventory[0].interpretationLevel, level);
        assert.equal(engine.stats().analysis, 1);
    }
    assert.equal(engine.state.inventory[1].interpretationLevel, 1);
    assert.ok(engine.purchase('item_moon_powder').success);
    assert.equal(engine.use('item_moon_powder', { rumorId: 'first' }).success, false);
    assert.equal(engine.state.inventory.find(i => i.id === 'item_moon_powder').quantity, 1);
    assert.ok(engine.use('item_moon_powder', { rumorId: 'second' }).success);
    assert.equal(engine.state.inventory[1].interpretationLevel, 10);
    const saved = JSON.stringify(engine.state);
    const restored = new ItemEngine({ market, state: JSON.parse(saved), blackSwanEnabled: false, clock: () => 1000 });
    assert.equal(JSON.stringify(restored.state), saved);
    assert.equal(restored.decoderTargets().length, 0);
});

test('legacy text, quantities and levels survive; high stats are clamped without deleting saved growth', () => {
    const { engine, market } = fixture();
    engine.state.baseStats.analysis = 20;
    assert.equal(engine.stats().analysis, 10);
    assert.equal(engine.state.baseStats.analysis, 20);
    const legacy = { id: 'old', category: 'intel', targetStockId: 'CLOUDBERRY', interpretationLevel: 5, price: 777, quantity: 2, intelReport: '보존된 원문' };
    engine.state.inventory.push(legacy);
    const saved = JSON.stringify(legacy);
    new ItemEngine({ market, state: engine.state, clock: () => 1000 });
    assert.equal(JSON.stringify(legacy), saved);
    assert.equal(rumorDecryption(legacy.intelReport, legacy, 10).text, legacy.intelReport);
    assert.equal(rumorDecryption(legacy.intelReport, legacy, 10).maxLevel, 5);
    assert.equal(drawAuthoredRumor(() => 0, () => false), null);
});
