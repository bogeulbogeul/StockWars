import test from 'node:test';import assert from 'node:assert/strict';import {MarketEngine, marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
function setup(){const e=new MarketEngine();e.stopEngine();e.isTutorialActive=false;e.cash=1000;e.portfolio.clear();e.stocks.get('CLOUDBERRY').price=100;return e;}
test('limit buy waits, fills once at a better price; sell waits for its lower bound',()=>{
 const e=setup(),id='CLOUDBERRY';assert.equal(e.placeLimitOrder('buy',id,2,1,90).queued,true);assert.equal(e.cash,1000);e.stocks.get(id).price=85;e.notify();assert.equal(e.cash,830);assert.equal(e.limitOrders.length,0);e.notify();assert.equal(e.cash,830);
 assert.equal(e.placeLimitOrder('sell',id,2,1,110).queued,true);e.stocks.get(id).price=115;e.notify();assert.equal(e.portfolio.size,0);assert.equal(e.cash,1060);
});
test('cancel, invalid price, locked leverage, and insufficient funds cannot create a fill',()=>{
 const e=setup(),id='CLOUDBERRY';assert.equal(e.placeLimitOrder('buy',id,1,1,0).success,false);assert.equal(e.placeLimitOrder('buy',id,1,2,90).success,false);
 e.placeLimitOrder('buy',id,1,1,90);e.cancelLimitOrder(e.limitOrders[0].id);e.stocks.get(id).price=80;e.notify();assert.equal(e.cash,1000);assert.equal(e.portfolio.size,0);
 e.stocks.get(id).price=100;e.placeLimitOrder('buy',id,1,1,90);e.cash=0;e.stocks.get(id).price=80;e.notify();assert.equal(e.portfolio.size,0);assert.equal(e.limitOrders.length,0);
});
