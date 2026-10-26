import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';
marketEngine.stopEngine();
function setup(trait) {
    let now = 1000000;
    const market = new MarketEngine(); market.stopEngine(); market.cash = 1000000;
    const engine = new ItemEngine({ market, clock: () => now, random: () => 0 });
    applyPlayerTrait(engine.state, { trait: { key: trait } });
    market.itemEngine = engine;
    for (const stock of market.stocks.values()) {
        stock.price = 1000;
        market.orderBooks.set(stock.id, { referencePrice: 1000, asks: [{ price: 1000, vol: 1000 }], bids: [{ price: 1000, vol: 1000 }] });
    }
    return { market, engine, advance(ms) { now += ms; engine.tick(); } };
}
test('personality does not discount fees or increase labor rewards', () => {
    const {market:m,engine:e} = setup('negotiation');
    assert.ok(Math.abs(m.getOrderQuote(1000,10).feeRate - 0.0015) < 1e-10);
    const preview = m.getExecutionPreview('buy','CLOUDBERRY',10);
    const cash = m.cash;
    assert.equal(m.buyStock('CLOUDBERRY',10).success,true);
    assert.equal(m.cash,cash-preview.total);
    assert.equal(m.tradeHistory[0].fee,preview.fee);
    const before=m.cash;
    assert.equal(e.finishLabor(800).goldReward,800);
    assert.equal(m.cash,before+800);
    assert.ok(m.getOrderQuote(1000,10,1,'brokerage').feeRate >= 0);
});
test('all listed stocks can be held together and remain tradable after reload', () => {
    const { market, engine } = setup();
    const ids = [...market.stocks.keys()];
    assert.equal(ids.length, 72);
    for (const id of ids) assert.equal(market.buyStock(id, 1).success, true, id);
    assert.equal(new Set([...market.portfolio.values()].map(p => p.id)).size, 72);
    assert.equal(market.getState().portfolioSlots, null);
    const positions = structuredClone([...market.portfolio]);
    market.itemEngine = new ItemEngine({ market, state: structuredClone(engine.state), clock: engine.clock });
    assert.equal(market.itemEngine.portfolioSlots(), Infinity);
    assert.deepEqual([...market.portfolio], positions);
    assert.equal(market.buyStock(ids[0], 1).success, true);
    assert.equal(market.sellStock(ids[0], 1).success, true);
});

test('new symbols via limit orders and short positions ignore legacy slot limits', () => {
    const { market, engine } = setup();
    const ids = [...market.stocks.keys()];
    engine.portfolioSlots = () => 5; // A legacy provider cannot reinstate the retired restriction.
    for (const id of ids.slice(0, 6)) assert.equal(market.buyStock(id, 1).success, true);
    assert.equal(market.placeLimitOrder('buy', ids[6], 1, 1, 1000).success, true);
    assert.equal(market.heldQuantity(ids[6]), 1);
    assert.equal(market.placeLimitOrder('buy', ids[7], 1, 1, 999).success, true);
    const book = market.orderBooks.get(ids[7]); book.asks[0].price = 999;
    market.processLimitOrders();
    assert.equal(market.heldQuantity(ids[7]), 1);
    market.isLevel10Unlocked = true;
    assert.equal(market.shortStock(ids[8], 1).success, true);
    market.cash = 0;
    assert.equal(market.buyStock(ids[9], 1).success, false);
});

test('investment amount is unlimited at every management level',()=>{
    const {market:m,engine:e}=setup();
    assert.equal(e.buyCap(),Infinity);
    assert.equal(m.getExecutionPreview('buy','CLOUDBERRY',100).quantity,100);
    assert.equal(m.placeLimitOrder('buy','CLOUDBERRY',11,1,1000).success,true);
    assert.equal(m.buyStock('CLOUDBERRY',100).quantity,100);
    assert.equal(m.buyStock('CLOUDBERRY',1).success,true);
    e.state.baseStats.management=1;
    assert.equal(m.buyStock('CLOUDBERRY',1).success,true);
    e.state.baseStats.management=5;
    assert.equal(e.buyCap(),Infinity);
});
test('legacy recovery never changes common heart capacity or labor costs',()=>{
    const a=setup(), b=setup('recovery');
    a.engine.state.stamina=b.engine.state.stamina=0;
    a.engine.tick();b.engine.tick();
    a.advance(300000);b.advance(300000);
    assert.equal(a.engine.state.stamina,0);assert.equal(b.engine.state.stamina,0);
    a.advance(86400000);assert.equal(a.engine.state.stamina,0);
    for (const [level,max] of [[0,3],[1,3],[2,3],[3,3],[4,3],[5,3]]) {
        b.engine.state.baseStats.recovery=level;assert.equal(b.engine.maxStamina(),max);
    }
    b.engine.state.baseStats.recovery=5;
    assert.equal(b.engine.finishLabor(0).staminaCost,1);

});
