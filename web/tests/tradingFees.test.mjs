import test from 'node:test';
import assert from 'node:assert/strict';
import {MarketEngine,marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
const id='CLOUDBERRY';
function setup(){const e=new MarketEngine();e.stopEngine();e.cash=100000;e.stocks.get(id).price=10000;return e;}
test('phone 0.15% and brokerage 0.01% are charged on buys and sells',()=>{
 for(const [venue,fee] of [['phone',15],['brokerage',1]]){
  const e=setup();e.buyStock(id,1,1,venue);
  assert.equal(e.cash,90000-fee);assert.equal(e.portfolio.get(`${id}_LONG_1`).collateral,10000);
  assert.equal(e.getSellPreview(id,1,venue).proceeds,10000-fee);
  const sale=e.sellStock(id,1,venue);
  assert.equal(sale.trade.profit,-2*fee);assert.equal(e.cash,100000-2*fee);
  assert.deepEqual(e.tradeHistory.map(t=>[t.fee,t.venue]),[[fee,venue],[fee,venue]]);
 }
});
test('pending orders preserve originating venue through save and charge only at execution',()=>{
 const e=setup();e.placeLimitOrder('buy',id,1,1,9000,'brokerage');
 assert.equal(e.cash,100000);assert.equal(e.tradeHistory.length,0);
 e.limitOrders=JSON.parse(JSON.stringify(e.limitOrders));
 e.stocks.get(id).price=8000;e.notify();e.notify();
 assert.equal(e.cash,91999);assert.equal(e.tradeHistory.length,1);
 assert.equal(e.tradeHistory[0].fee,1);assert.equal(e.tradeHistory[0].venue,'brokerage');
});
test('fee is included in affordability, MAX, and margin trades',()=>{
 const e=setup();e.cash=20000;
 assert.equal(e.getMaxOrderQty(10000,1,'phone'),1);
 assert.equal(e.buyStock(id,2).quantity,1);
 assert.equal(e.cash,9985);
 e.cash=20000;
 assert.equal(e.placeLimitOrder('buy',id,2,1,10000).success,false);
 e.isLevel10Unlocked=true;e.shortStock(id,2,2,'phone');
 assert.equal(e.cash,9970);assert.equal(e.tradeHistory.at(-1).fee,30);
 assert.equal(e.portfolio.get(`${id}_SHORT_2`).collateral,10000);
});
test('partial sales allocate original entry fees without double counting',()=>{
 const e=setup();e.buyStock(id,2,1,'phone');
 assert.equal(e.sellStock(id,1,'brokerage').trade.profit,-16);
 assert.equal(e.sellStock(id,1,'brokerage').trade.profit,-16);
 assert.equal(e.cash,99968);
});
