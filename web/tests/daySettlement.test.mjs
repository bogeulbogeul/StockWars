import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';

marketEngine.stopEngine();

test('rent requires cash, charges once, and preserves holdings across restored settlement', () => {
    const engine = new MarketEngine();
    engine.stopEngine();
    engine.cash = 6000;
    engine.settleRent();
    assert.equal(engine.cash, 6000, 'early preview must not charge');
    engine.day = 7;
    engine.cash = 4000;
    engine.getPortfolioValue = () => 100000;
    assert.equal(engine.settleRent().rentPaid, undefined);
    assert.equal(engine.cash, 4000, 'holdings cannot cover the rent');
    engine.cash = 6000;
    const holdings = JSON.stringify([...engine.portfolio]);
    const receipt = engine.settleRent();
    assert.equal(receipt.rentPaid, true);
    assert.equal(receipt.cashAfterRent, 1000);
    assert.equal(engine.cash, 1000);
    assert.equal(JSON.stringify([...engine.portfolio]), holdings);
    assert.equal(engine.settleRent(), receipt);
    assert.equal(engine.cash, 1000);
    const restored = new MarketEngine();
    restored.stopEngine();
    restored.day = 7;
    restored.cash = engine.cash;
    restored.rentSettlement = JSON.parse(JSON.stringify(receipt));
    restored.settleRent();
    assert.equal(restored.cash, 1000);
    restored.reset();
    restored.stopEngine();
    assert.equal(restored.rentSettlement, null);
});
