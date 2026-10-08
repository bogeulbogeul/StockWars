import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrderBook,updateGhostLiquidity} from '../js/engine/OrderMatching.js';
import {MarketEngine,marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
const id='CLOUDBERRY', stock={id,price:1000};
const total=(book,side)=>book[side].reduce((sum,p)=>sum+p.vol,0);
test('shared buying and selling pressure consume opposite depth and strengthen resting orders',()=>{
 const initial=createOrderBook(stock), neutral=updateGhostLiquidity(structuredClone(initial),stock,0,1);
 const up=updateGhostLiquidity(structuredClone(initial),{...stock,price:1010},1,1);
 const down=updateGhostLiquidity(structuredClone(initial),{...stock,price:990},-1,1);
 assert.ok(total(up,'asks')<total(neutral,'asks'));assert.ok(total(up,'bids')>total(neutral,'bids'));
 assert.ok(total(down,'bids')<total(neutral,'bids'));assert.ok(total(down,'asks')>total(neutral,'asks'));
 assert.equal(up.ghostFlow.side,'buy');assert.equal(down.ghostFlow.side,'sell');
 assert.equal(up.ghostFlow.quantity,150);assert.equal(up.referencePrice,1010);
});
test('depleted player liquidity recovers gradually, remains bounded and does not reset',()=>{
 const book=createOrderBook(stock);book.asks[0].vol=0;
 updateGhostLiquidity(book,stock,0,1);
 assert.ok(book.asks[0].vol>0&&book.asks[0].vol<50);
 for(let i=0;i<500;i++)updateGhostLiquidity(book,stock,i%2?1:-1,i);
 for(const level of [...book.asks,...book.bids])assert.ok(Number.isInteger(level.vol)&&level.vol>=0&&level.vol<=400);
});
test('one tick publishes aligned chart price and depth; inspection never advances ghost flow',()=>{
 const e=new MarketEngine();e.stopEngine();e.stocks.get(id).price=1000;
 e.getChartHistory(id);const book=e.ensureOrderBook(id), beforeCash=e.cash;
 let observed=0;
 e.subscribe(()=>{
  observed++;
  assert.equal(e.orderBooks.get(id).referencePrice,e.stocks.get(id).price);
  assert.equal(e.getChartHistory(id).at(-1).price,e.stocks.get(id).price);
 });
 const random=Math.random;
 try{Math.random=()=>0.99;e.tick();}finally{Math.random=random;}
 assert.equal(observed,1);assert.equal(e.orderBooks.get(id),book);
 assert.ok(e.stocks.get(id).price>1000);assert.equal(book.ghostFlow.side,'buy');
 assert.equal(e.cash,beforeCash);assert.equal(e.tradeHistory.length,0);
 const snapshot=JSON.stringify(book);
 e.getOrderBook(id);e.getOrderBook(id);e.getExecutionPreview('buy',id,10);
 assert.equal(JSON.stringify(book),snapshot);
});
