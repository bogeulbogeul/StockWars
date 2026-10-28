import test from 'node:test';
import assert from 'node:assert/strict';
import { RotatingMarketNews, applyMarketNews } from '../js/engine/RotatingMarketNews.js';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { attachSessionMarketNews } from '../js/app/SessionMarketNews.js';
marketEngine.stopEngine();
const catalog = [
    { id:'p',stockId:'CLOUDBERRY',category:'일반 호재',body:['좋은 소식'] },
    { id:'n',stockId:'CLOUDBERRY',category:'핵심 악재',body:['나쁜 소식'] },
    { id:'e',stockId:'ECOBATTERY',category:'일반 호재',body:['소식'] }
];
test('news exists at launch; replaces once at 3 minutes without repeating the previous company article',()=>{
    const feed=new RotatingMarketNews(catalog,{startedAt:1000,random:()=>0});
    const first=feed.read(1000);assert.equal(first.length,2);assert.equal(first[0].articleId,'p');
    assert.equal(feed.sync(180999),false);assert.equal(feed.sync(181000),true);
    const next=feed.read(181000);assert.equal(next[0].articleId,'n');assert(!next.some(a=>a.id===first[0].id));
    assert.equal(next[0].publishedAt,181000);assert.equal(next[0].expiresAt,361000);
    assert.equal(feed.sync(181001),false);assert.equal(feed.sync(361000),true);
});
test('missed time windows publish only the current news rather than replaying old batches',()=>{
    const feed=new RotatingMarketNews(catalog,{startedAt:0,random:()=>0});feed.read(0);feed.read(180000*5+100);
    assert.equal(feed.batch,5);assert.equal(feed.articles.length,2);assert.equal(feed.articles[0].publishedAt,900000);
});
test('news moves matching prices/history and resets liquidity without changing cash or share counts',()=>{
    const e=new MarketEngine();e.stopEngine();e.buyStock('CLOUDBERRY',1);
    e.stocks.get('CLOUDBERRY').price=1000;const cash=e.cash,qty=e.heldQuantity('CLOUDBERRY');
    e.ensureOrderBook('CLOUDBERRY');
    applyMarketNews(e,[{stockId:'CLOUDBERRY',impactRate:.04}]);
    assert.equal(e.stocks.get('CLOUDBERRY').price,1040);assert.equal(e.priceHistory.get('CLOUDBERRY').at(-1),1040);
    assert(!e.orderBooks.has('CLOUDBERRY'));assert.equal(e.cash,cash);assert.equal(e.heldQuantity('CLOUDBERRY'),qty);
    applyMarketNews(e,[{stockId:'CLOUDBERRY',impactRate:-.05}]);assert.equal(e.stocks.get('CLOUDBERRY').price,988);
});
test('re-reading or reattaching the same session never applies the same news twice',()=>{
    const e=new MarketEngine();e.stopEngine();const binding=attachSessionMarketNews(e);
    const prices=JSON.stringify([...e.stocks].map(([id,s])=>[id,s.price]));
    binding.refresh();binding.refresh();attachSessionMarketNews(e);assert.equal(JSON.stringify([...e.stocks].map(([id,s])=>[id,s.price])),prices);
    assert.equal(e.news.length,e.stocks.size);
});
