import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { TownStage } from '../js/components/TownStage.js';
import { TownPlayerController } from '../js/components/town/TownPlayerController.js';
import { TOWN_LANDSCAPE_INTERACTIVE } from '../js/data/townLandscape.js';
import { VENDING_ITEM, VendingCycle } from '../js/components/town/TownVendingModal.js';

test('vending selection, dispensing and collection cannot charge twice', () => {
    const cycle = new VendingCycle();
    let charges = 0;
    const purchase = () => { charges++; return { success: true }; };
    assert.equal(cycle.buy(purchase, false), null);
    cycle.select();
    assert.ok(cycle.buy(purchase, false).success);
    assert.equal(cycle.collect(), false);
    assert.equal(cycle.buy(purchase, false), null);
    cycle.finish();
    assert.equal(cycle.buy(purchase, false), null);
    assert.equal(cycle.collect(), true);
    assert.equal(cycle.collect(), false);
    assert.equal(charges, 1);
    cycle.select();
    cycle.buy(() => ({ success: false }), false);
    assert.equal(cycle.phase, 'selected');
});

const setup = (cash = 2000) => {
    const market = { cash, stocks: new Map() };
    const engine = new ItemEngine({ market, clock: () => Date.parse('2026-09-29T03:00:00+09:00') });
    return { engine, market };
};
test('vending approach is reachable and opens its own action', () => {
    const vending = TOWN_LANDSCAPE_INTERACTIVE.find(p => p.type === 'vending');
    const playerController = new TownPlayerController();
    playerController.placeAt(vending);
    assert.ok(playerController.canStand(playerController.charPosX, playerController.charPosY));
    let opened = 0;
    const stage = { playerController, callbacks: {}, vendingModal: { open: () => opened++ } };
    TownStage.prototype.checkProximity.call(stage);
    assert.equal(stage.activeNearbyObject.id, vending.id);
    TownStage.prototype.triggerAction.call(stage, stage.activeNearbyObject);
    assert.equal(opened, 1);
});
test('overnight drink purchases share shop limits and charge the catalog price', () => {
    const { engine, market } = setup();
    assert.ok(engine.purchase(VENDING_ITEM.id, 1).success);
    assert.equal(market.cash, 2000 - VENDING_ITEM.price);
    assert.equal(engine.state.inventory[0].quantity, 1);
    assert.ok(engine.purchase(VENDING_ITEM.id, 1).success);
    assert.equal(engine.purchase(VENDING_ITEM.id, 1).success, false);
    assert.equal(market.cash, 1000);
});
test('instant drinking restores stamina; rejected purchases do not charge', () => {
    const { engine, market } = setup();
    assert.equal(engine.purchase(VENDING_ITEM.id, 1, true).success, false);
    assert.equal(market.cash, 2000);
    engine.state.stamina = 1;
    assert.ok(engine.purchase(VENDING_ITEM.id, 1, true).success);
    assert.equal(engine.state.stamina, 2);
    assert.equal(engine.state.inventory.length, 0);
    const poor = setup(0);
    assert.equal(poor.engine.purchase(VENDING_ITEM.id).success, false);
    assert.equal(poor.market.cash, 0);
    const full = setup();
    full.engine.add(VENDING_ITEM.id, 99);
    assert.equal(full.engine.purchase(VENDING_ITEM.id).success, false);
    assert.equal(full.market.cash, 2000);
});
