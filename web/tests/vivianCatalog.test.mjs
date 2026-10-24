import test from 'node:test';
import assert from 'node:assert/strict';
import { VIVIAN_SHOP_CATALOG as catalog, VIVIAN_ITEM_REGISTRY } from '../js/data/vivianStoreData.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { getFlowerShopHtml } from '../js/components/store/VivianShopTemplate.js';
const fixture = () => new ItemEngine({ market: { cash: 100000, stocks: new Map() }, blackSwanEnabled: false });

test('one shelf sells the eight foods and three priced planning products', () => {
    assert.equal(catalog.length, 12);
    assert.equal(catalog.filter(i => i.recoveryFood).length, 8);
    for (const item of catalog.filter(i => i.recoveryFood)) assert.equal(item.price, item.id === 'item_honey_cookie' ? 800 : 200);
    for (const [id, price] of [['item_crypto_decoder',500],['item_lotto_ticket',500],['item_premium_rumor',1000]])
        assert.equal(catalog.find(i => i.id === id).price, price);
    assert(catalog.every(i => !i.tab && !i.reqUnlock));
    assert.doesNotMatch(getFlowerShopHtml(), /data-tab=|일일|주간 특수|비밀 서랍|1–3/);
});
test('retired goods cannot be purchased but existing ownership remains usable', () => {
    const e = fixture();
    for (const id of ['item_energy_drink','item_caffeine_shot','item_focus_pill','item_weekly_drink_ration','item_darknet_key','item_gas_mask']) {
        const cash = e.market.cash;
        assert.equal(e.purchase(id).success, false, id);
        assert.equal(e.market.cash, cash);
        assert(VIVIAN_ITEM_REGISTRY.some(i => i.id === id));
    }
    e.add('item_energy_drink'); e.state.stamina = 0;
    assert(e.use('item_energy_drink').success);
    assert.equal(e.state.stamina, 1);
    assert(e.purchase('item_energy_drink',1,false,{vending:true}).success);
});
test('every food purchases and heals one heart; full hearts never waste it', () => {
    for (const item of catalog.filter(i => i.recoveryFood)) {
        const e = fixture(); e.state.stamina = 0;
        assert(e.purchase(item.id, 1, true).success, item.name);
        assert.equal(e.state.stamina, 1); assert.equal(e.market.cash, 100000 - item.price);
        e.state.stamina = e.maxStamina();
        assert.equal(e.purchase(item.id, 1, true).success, false);
        assert.equal(e.market.cash, 100000 - item.price);
        assert(e.purchase(item.id).success);
        assert.equal(e.use(item.id).success, false);
        assert.equal(e.state.inventory.find(i => i.id === item.id).quantity, item.packSize ? 2 : 1);
    }
});


test('cookie sets retain their container until the fourth cookie is eaten', () => {
    const e = fixture(); e.state.stamina = 0;
    assert(e.purchase('item_honey_cookie', 2).success);
    assert.equal(e.market.cash, 98400);
    assert.equal(e.state.inventory[0].quantity, 2);
    assert.equal(e.state.inventory[0].openedRemaining, 4);
    assert.equal(e.state.inventory[0].price, 800);
    for (let i = 1; i <= 4; i++) {
        e.state.stamina = 0;
        assert(e.use('item_honey_cookie').success);
        assert.equal(e.state.stamina, 1);
        assert.equal(e.state.inventory[0].quantity, i === 4 ? 1 : 2);
        assert.equal(e.state.inventory[0].openedRemaining, i === 4 ? 4 : 4-i);
    }
    const restored = new ItemEngine({market: e.market, state: structuredClone(e.state), blackSwanEnabled: false});
    assert.equal(restored.state.inventory[0].quantity, 1);
    assert.equal(restored.state.inventory[0].openedRemaining, 4);
    for (let i=0;i<4;i++) {restored.state.stamina=0; assert(restored.use('item_honey_cookie').success);}
    assert.equal(restored.state.inventory.length, 0);
});
test('instant purchase keeps a three-cookie set; full hearts and full bags do not waste it', () => {
    const e = fixture(); e.state.stamina = 0;
    assert(e.purchase('item_honey_cookie', 1, true).success);
    assert.equal(e.market.cash, 99200);
    assert.equal(e.state.inventory[0].quantity, 1);
    assert.equal(e.state.inventory[0].openedRemaining, 3);
    e.state.stamina = e.maxStamina();
    assert.equal(e.use('item_honey_cookie').success, false);
    assert.equal(e.state.inventory[0].openedRemaining, 3);
    e.state.inventory[0].quantity = 99;
    const cash = e.market.cash;
    assert.equal(e.purchase('item_honey_cookie').success, false);
    assert.equal(e.market.cash, cash);
});
test('old individual cookie saves preserve their edible count during set migration', () => {
    const e = fixture(); e.add('item_honey_cookie');
    Object.assign(e.state.inventory[0], {quantity:5, cookieSet:undefined});
    const restored = new ItemEngine({market:e.market,state:structuredClone(e.state),blackSwanEnabled:false});
    assert.equal(restored.state.inventory[0].quantity,2);
    assert.equal(restored.state.inventory[0].openedRemaining,1);
    restored.state.stamina=0; restored.use('item_honey_cookie');
    assert.equal(restored.state.inventory[0].quantity,1);
    assert.equal(restored.state.inventory[0].openedRemaining,4);
});

test('star and moon powders affect only the selected rumor and never player analysis', () => {
    const e = fixture();
    const rumor = id => ({id,category:'intel',isRead:true,targetStockId:'test',interpretationLevel:1,quantity:1});
    e.state.inventory.push(rumor('first'),rumor('second'));
    const stats = structuredClone(e.state.baseStats);
    assert(e.purchase('item_crypto_decoder').success);
    assert(e.use('item_crypto_decoder',{rumorId:'first'}).success);
    assert.equal(e.state.inventory[0].interpretationLevel,2);
    assert(e.purchase('item_moon_powder').success);
    assert(e.use('item_moon_powder',{rumorId:'first'}).success);
    assert.equal(e.state.inventory[0].interpretationLevel,5);
    assert.equal(e.state.inventory[1].interpretationLevel,1);
    assert.deepEqual(e.state.baseStats,stats);
    assert(e.purchase('item_moon_powder').success);
    const cash = e.market.cash;
    assert.equal(e.use('item_moon_powder',{rumorId:'first'}).success,false);
    assert.equal(e.market.cash,cash);
    assert.equal(e.state.inventory.find(i=>i.id==='item_moon_powder').quantity,1);
    assert(!catalog.some(i=>i.name==='반짝가루'));
    assert.equal(catalog.find(i=>i.name==='별가루').price,500);
    assert.equal(catalog.find(i=>i.name==='달가루').price,2000);
});
