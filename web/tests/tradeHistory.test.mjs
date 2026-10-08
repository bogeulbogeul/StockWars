import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
function setup() {
    const e = new MarketEngine(); e.stopEngine(); e.cash = 10000;
    e.stocks.get('CLOUDBERRY').price = 100;
    return e;
}
test('records successful fills with actual quantities and immutable execution prices', () => {
    const e = setup(), id = 'CLOUDBERRY';
    assert.equal(e.sellStock(id, 1).success, false);
    assert.equal(e.tradeHistory.length, 0);
    e.buyStock(id, 3);
    e.stocks.get(id).price = 120;
    e.sellStock(id, 10);
    assert.deepEqual(e.tradeHistory.map(t => [t.side,t.quantity,t.price,t.cashDelta,t.profit]),
        [['buy',3,100,-300,null],['sell',3,120,359,59]]);
    assert.equal(e.getState().tradeHistory.length, 2);
    e.reset(); e.stopEngine();
    assert.equal(e.tradeHistory.length, 0);
});
test('queued and cancelled orders create no history; limit fills record only once', () => {
    const e = setup(), id = 'CLOUDBERRY';
    e.placeLimitOrder('buy',id,2,1,90);
    assert.equal(e.tradeHistory.length,0);
    e.stocks.get(id).price = 85; e.notify(); e.notify();
    assert.equal(e.tradeHistory.length,1);
    assert.equal(e.tradeHistory[0].price,85);
    e.placeLimitOrder('sell',id,2,1,110);
    e.cancelLimitOrder(e.limitOrders[0].id);
    assert.equal(e.tradeHistory.length,1);
});
test('short entry and escape liquidation are recorded', () => {
    const e = setup(); e.isLevel10Unlocked = true;
    e.shortStock('CLOUDBERRY',2,2);
    e.stocks.get('CLOUDBERRY').price = 90;
    e.liquidateForEscape();
    assert.deepEqual(e.tradeHistory.map(t=>[t.side,t.cashDelta,t.profit]),
        [['short',-100,null],['liquidate',140,40]]);
});
