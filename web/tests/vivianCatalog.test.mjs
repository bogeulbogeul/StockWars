import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIVIAN_SHOP_CATALOG as catalog } from '../js/data/vivianStoreData.js';

globalThis.document = { getElementById: () => ({}) };
const { VivianStoreModal } = await import('../js/components/store/VivianStoreModal.js');
const { toastManager } = await import('../js/components/ToastManager.js');
toastManager.show = () => {};
const item = id => catalog.find(entry => entry.id === id);

test('every GDD product is sold at its specified price', () => {
    const gdd = readFileSync(new URL('../../Docs/MOD_GDD_03_1_VivianStore.md', import.meta.url), 'utf8');
    const rows = [...gdd.matchAll(/\| \*\*(.+?)\*\* \| ([\d,]+) G \|/g)];
    assert.equal(catalog.length, rows.length);
    for (const [, name, price] of rows) {
        const product = catalog.find(entry => entry.name === name);
        assert.ok(product, `Missing GDD product: ${name}`);
        assert.equal(product.price, Number(price.replaceAll(',', '')), name);
    }
    assert.equal(item('item_logistics_quickpass_1d').tab, 'daily');
    assert.equal(item('item_logistics_quickpass_7d').tab, 'weekly');
    assert.equal(item('item_weekly_drink_ration').tab, 'weekly');
});

function storeFor(id, progress = {}) {
    return Object.assign(Object.create(VivianStoreModal.prototype), {
        selectedItemId: id, quantity: 1, purchasedCounts: {}, affinity: 200,
        callbacks: { getCash: () => 100000, getShopProgress: () => progress },
        triggerDialogue() {}, updateHeaderInfo() {}, renderItemsGrid() {}, selectItem() {}
    });
}

test('secret requirements are conjunctive and cannot be bypassed by purchasing', () => {
    for (const [id, progress, key] of [
        ['item_black_swan_alarm', { profit: 10000, survivals: 1 }, 'survivals'],
        ['item_caffeine_shot', { profit: 20000 }, 'profit'],
        ['item_darknet_key', { analysisLevel: 5, decryptions: 50 }, 'decryptions']
    ]) {
        const store = storeFor(id, progress);
        assert.equal(store.isItemLocked(item(id)), false);
        progress[key]--;
        assert.equal(store.isItemLocked(item(id)), true);
        store.callbacks.onDeductCash = () => assert.fail('Locked item must not charge gold');
        store.executePurchase();
        assert.deepEqual(store.purchasedCounts, {});
    }
    const missing = storeFor('item_black_swan_alarm');
    assert.equal(missing.isItemLocked(item('item_black_swan_alarm')), true);
    const lowTrust = storeFor('item_caffeine_shot', { profit: 20000 });
    lowTrust.affinity = 199;
    assert.equal(lowTrust.isItemLocked(item('item_caffeine_shot')), true);
    assert.equal(missing.isItemLocked(item('item_gas_mask')), false);
});

test('caffeine heals one heart; two energy drinks heal two hearts', () => {
    for (const [id, quantity] of [['item_caffeine_shot', 1], ['item_energy_drink', 2]]) {
        const store = storeFor(id, { profit: 20000 });
        let healed = 0, paid = 0;
        store.quantity = quantity;
        store.callbacks.onStaminaHeal = amount => healed += amount;
        store.callbacks.onDeductCash = amount => paid += amount;
        store.executePurchase(true);
        assert.equal(healed, quantity);
        assert.equal(paid, item(id).price * quantity);
        assert.equal(store.purchasedCounts[id], quantity);
        store.executePurchase(true);
        assert.equal(healed, quantity, 'Daily limit blocks additional consumption');
    }
});
