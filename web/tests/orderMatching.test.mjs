import test from 'node:test';
import assert from 'node:assert/strict';
import {MarketEngine, marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
const id='CLOUDBERRY';
function setup(asks=[{price:1000,vol:300},{price:1010,vol:400},{price:1020,vol:300}], bids=[{price:1000,vol:1000}]) {
 const e=new MarketEngine();e.stopEngine();e.cash=2000000;e.stocks.get(id).price=1000;
 e.orderBooks.set(id,{referencePrice:1000,asks:structuredClone(asks),bids:structuredClone(bids)});
 return e;
}
test('1000 shares walk actual asks with weighted execution price and one order fee',()=>{
 const e=setup(), preview=e.getExecutionPreview('buy',id,1000);
 assert.equal(preview.gross,1010000);assert.equal(preview.averagePrice,1010);assert.equal(preview.total,1011515);
 assert.deepEqual(e.getExecutionPreview('buy',id,1000),preview);
 const result=e.buyStock(id,1000);
 assert.equal(result.quantity,1000);assert.equal(e.cash,988485);
 assert.equal(e.portfolio.get(`${id}_LONG_1`).avgPrice,1010);
 assert.equal(e.stocks.get(id).price,1020);
 assert.equal(e.tradeHistory[0].price,1010);assert.equal(e.tradeHistory[0].fee,1515);
 assert.deepEqual(e.tradeHistory[0].fills,[{price:1000,quantity:300},{price:1010,quantity:400},{price:1020,quantity:300}]);
 assert.deepEqual(e.getOrderBook(id).asks,[]);
 assert.equal(e.buyStock(id,1).success,false);
});
test('cash and liquidity produce partial fills without negative balance or market leftovers',()=>{
 const e=setup();e.cash=1002;
 const result=e.buyStock(id,1000);
 assert.equal(result.quantity,1);assert.equal(result.remaining,999);assert.equal(e.cash,0);
 assert.equal(e.limitOrders.length,0);assert.match(result.msg,/999주 취소/);
 const scarce=setup([{price:1000,vol:2}]);
 assert.equal(scarce.buyStock(id,10).quantity,2);
 assert.equal(scarce.buyStock(id,10).quantity,0);
 assert.equal(scarce.tradeHistory.length,1);
});
test('price protection and limit price prevent fills at excessively distant levels',()=>{
 const e=setup([{price:1000,vol:2},{price:1100,vol:10}]);
 assert.equal(e.buyStock(id,10).quantity,2);
 assert.equal(e.getOrderBook(id).asks[0].vol,10);
 const limit=setup();
 const result=limit.placeLimitOrder('buy',id,1000,1,1005,'brokerage');
 assert.equal(result.quantity,300);assert.equal(limit.limitOrders[0].qty,700);
 assert.equal(limit.tradeHistory[0].fee,30);
 limit.notify();assert.equal(limit.tradeHistory.length,1);
 limit.orderBooks.set(id,{referencePrice:1000,asks:[{price:1000,vol:100}],bids:[]});
 limit.notify();assert.equal(limit.limitOrders[0].qty,600);
 assert.equal(limit.tradeHistory[1].fee,10);
 limit.cancelLimitOrder(limit.limitOrders[0].id);assert.equal(limit.limitOrders.length,0);
 assert.equal(limit.orderBooks.get(id).asks[0].vol,0);
});
test('sell walks highest bids first and settles actual proceeds against entry costs',()=>{
 const e=setup([{price:1000,vol:10}],[{price:980,vol:2},{price:1000,vol:2}]);
 e.buyStock(id,4);
 const before=e.cash, preview=e.getSellPreview(id,10);
 const result=e.sellStock(id,10);
 assert.equal(result.quantity,4);assert.equal(result.trade.sellPrice,990);
 assert.equal(e.cash-before,3954);assert.equal(preview.proceeds,3954);
 assert.equal(result.trade.profit,-52);assert.equal(e.portfolio.size,0);
 assert.deepEqual(e.tradeHistory.at(-1).fills,[{price:1000,quantity:2},{price:980,quantity:2}]);
});
test('reads and saved book restoration do not replenish consumed volume; ticks do',()=>{
 const e=setup([{price:1000,vol:2}]);e.buyStock(id,1);
 const state=JSON.parse(JSON.stringify([...e.orderBooks]));
 const restored=setup();restored.orderBooks=new Map(state);
 assert.equal(restored.getOrderBook(id).asks[0].vol,1);
 const exposed=restored.getOrderBook(id);exposed.asks[0].vol=999;
 assert.equal(restored.getOrderBook(id).asks[0].vol,1);
 restored.tick();assert.ok(restored.getOrderBook(id).asks.length>1);
});
test('rejected orders leave both depth and account untouched',()=>{
 const e=setup();e.cash=0;const before=JSON.stringify(e.getOrderBook(id));
 assert.equal(e.buyStock(id,5).success,false);
 assert.equal(e.shortStock(id,5).success,false);
 assert.equal(e.sellStock(id,5).success,false);
 assert.equal(e.cash,0);assert.equal(e.tradeHistory.length,0);
 assert.equal(JSON.stringify(e.getOrderBook(id)),before);
});
test('execution uses fresh depth after a quote change and short orders consume bids',()=>{
 const e=setup();e.isLevel10Unlocked=true;
 const before=e.getExecutionPreview('buy',id,1);
 e.stocks.get(id).price=1200;
 e.buyStock(id,1);
 assert.equal(before.averagePrice,1000);assert.equal(e.tradeHistory.at(-1).price,1200);
 e.orderBooks.set(id,{referencePrice:1200,asks:[],bids:[{price:1200,vol:2},{price:1190,vol:3}]});
 const result=e.shortStock(id,5,1,'brokerage');
 assert.equal(result.quantity,5);assert.equal(e.tradeHistory.at(-1).price,1194);
 assert.equal(e.getOrderBook(id).bids.length,0);
});
test('a sell limit never consumes bids below its floor and keeps remaining shares queued',()=>{
 const e=setup([{price:1000,vol:10}],[{price:1000,vol:2},{price:980,vol:10}]);
 e.buyStock(id,5);
 const result=e.placeLimitOrder('sell',id,5,1,990);
 assert.equal(result.quantity,2);assert.equal(result.remaining,3);
 assert.equal(e.limitOrders[0].qty,3);
 assert.equal(e.heldQuantity(id),3);
 e.notify();assert.equal(e.heldQuantity(id),3);
 assert.equal(e.getOrderBook(id).bids[0].vol,10);
});
