import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';
import { LogisticsPhysicsEngine } from '../js/components/logistics/LogisticsPhysicsEngine.js';
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
test('negotiation changes actual fees, previews, history and labor without double reward', () => {
    const {market:m,engine:e} = setup('negotiation');
    assert.ok(Math.abs(m.getOrderQuote(1000,10).feeRate - 0.00098) < 1e-10);
    const preview = m.getExecutionPreview('buy','CLOUDBERRY',10);
    const cash = m.cash;
    assert.equal(m.buyStock('CLOUDBERRY',10).success,true);
    assert.equal(m.cash,cash-preview.total);
    assert.equal(m.tradeHistory[0].fee,preview.fee);
    const before=m.cash;
    assert.equal(e.finishLabor(800).goldReward,840);
    assert.equal(m.cash,before+840);
    e.state.passUntil=e.now()+100000;
    const quick=e.quickJob(); assert.equal(quick.goldReward,588);
    assert.equal(m.cash,before+840+588);
    assert.ok(m.getOrderQuote(1000,10,1,'brokerage').feeRate >= 0);
});
test('slots count unique stocks, block new stocks, release on full sale and survive reload', () => {
    const {market:m,engine:e}=setup();
    const ids=[...m.stocks.keys()].slice(0,6);
    for(const id of ids.slice(0,5))assert.equal(m.buyStock(id,1).success,true);
    assert.equal(m.buyStock(ids[5],1).success,false);
    assert.equal(m.buyStock(ids[0],1).success,true);
    m.sellStock(ids[0],1); assert.equal(m.buyStock(ids[5],1).success,false);
    m.sellStock(ids[0],1); assert.equal(m.buyStock(ids[5],1).success,true);
    assert.equal(m.getState().portfolioSlots.used,5);
    applyPlayerTrait(e.state,{trait:{key:'management'}});
    assert.equal(e.portfolioSlots(),12);
    const restored=new ItemEngine({market:m,state:structuredClone(e.state),clock:e.clock});
    applyPlayerTrait(restored.state,{trait:{key:'management'}});
    assert.equal(restored.portfolioSlots(),12);
});
test('investment cap limits fills, rejects oversized limit orders and grows with management',()=>{
    const {market:m,engine:e}=setup();
    assert.equal(m.getExecutionPreview('buy','CLOUDBERRY',100).quantity,10);
    assert.equal(m.placeLimitOrder('buy','CLOUDBERRY',11,1,1000).success,false);
    assert.equal(m.buyStock('CLOUDBERRY',100).quantity,10);
    assert.equal(m.buyStock('CLOUDBERRY',1).success,false);
    e.state.baseStats.management=1;
    assert.equal(m.buyStock('CLOUDBERRY',1).success,true);
    e.state.baseStats.management=5;
    assert.equal(e.buyCap(),Infinity);
});
test('recovery increases heart capacity without time regeneration and preserves labor bonuses',()=>{
    const a=setup(), b=setup('recovery');
    a.engine.state.stamina=b.engine.state.stamina=0;
    a.engine.tick();b.engine.tick();
    a.advance(300000);b.advance(300000);
    assert.equal(a.engine.state.stamina,0);assert.equal(b.engine.state.stamina,0);
    a.advance(86400000);assert.equal(a.engine.state.stamina,0);
    for (const [level,max] of [[0,3],[1,3],[2,4],[3,4],[4,5],[5,5]]) {
        b.engine.state.baseStats.recovery=level;assert.equal(b.engine.maxStamina(),max);
    }
    b.engine.state.baseStats.recovery=5;
    assert.equal(b.engine.finishLabor(0).staminaCost,0);
    const physics=new LogisticsPhysicsEngine();
    const state={hasBox:true,carriedCount:2,velocityX:100,keysHeld:new Set(['shift']),damageGauge:0,wobbleAngle:0};
    physics.updateSensitivity(state,0.1); const normal=state.damageGauge;
    state.damageGauge=0;state.abilityBonuses=b.engine.logisticsBonuses();
    physics.updateSensitivity(state,0.1);
    assert.ok(Math.abs(state.damageGauge-normal*0.85)<1e-10);
});
