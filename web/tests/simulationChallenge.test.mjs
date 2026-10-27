import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { SimulationChallenge } from '../js/app/SimulationChallenge.js';
marketEngine.stopEngine();
function setup() { const e = new MarketEngine(); e.stopEngine(); return [e, new SimulationChallenge(e)]; }

test('challenge needs real executions; rejected orders cannot unlock progression', () => {
    const [e,c] = setup();
    assert.equal(c.advance(), false); assert.equal(c.finish(), null);
    assert.equal(e.buyStock('CLOUDBERRY', 0).success, false);
    assert.equal(c.bought, false); assert.equal(c.advance(), false);
    assert.equal(e.buyStock('CLOUDBERRY', 1).success, true);
    assert.equal(c.bought, true);
    for (let i=0;i<3;i++) assert.equal(c.advance(), true);
    assert.equal(c.advance(), false); assert.equal(c.finish(), null);
    assert.equal(e.sellStock('CLOUDBERRY',1).success, true);
    const result = c.finish(); assert(result);
    assert.equal(result.assets, e.cash); assert.equal(result.holdings,0);
    assert.equal(result.profit,e.cash-5000); assert.equal(result.trades,2);
    assert.equal(c.finish(),null); assert.equal(c.advance(),false);
});

test('sector news moves unowned stocks too, without creating money or changing another session', () => {
    const [e,c] = setup(), [other] = setup();
    e.buyStock('CLOUDBERRY',1);
    const cash=e.cash, it=e.stocks.get('CLOUDBERRY').price, energy=e.stocks.get('ECOBATTERY').price;
    const untouched=other.getState();
    c.advance();
    assert(e.stocks.get('CLOUDBERRY').price>it); assert(e.stocks.get('ECOBATTERY').price>energy);
    assert.equal(e.cash,cash); assert.equal(e.heldQuantity('CLOUDBERRY'),1);
    assert.equal(other.cash,untouched.cash); assert.equal(other.stocks.get('CLOUDBERRY').price,850);
    assert.equal(other.tradeHistory.length,0);
});

test('results include remaining shares at market value and retry starts a fresh account', () => {
    const [e,c] = setup(); e.buyStock('CLOUDBERRY',2);
    c.advance();c.advance();c.advance();e.sellStock('CLOUDBERRY',1);
    const r=c.finish();assert.equal(e.heldQuantity('CLOUDBERRY'),1);
    assert.equal(r.assets,r.cash+r.holdings);assert.equal(r.holdings,e.getPortfolioValue());
    e.reset();e.stopEngine();assert.equal(e.cash,5000);assert.equal(e.tradeHistory.length,0);assert.equal(e.portfolio.size,0);
});
