import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';
marketEngine.stopEngine();
function market() {
    const engine = new MarketEngine(); engine.stopEngine();
    engine.stocks = new Map([
        ['CLOUDBERRY', { id:'CLOUDBERRY', name:'추천주', price:800, prevPrice:790, tier:'B' }],
        ['OTHER', { id:'OTHER', name:'대체주', price:600, prevPrice:600, tier:'B' }]
    ]);
    engine.priceHistory = new Map([['CLOUDBERRY', [800]], ['OTHER', [600]]]);
    engine.cash = 1000;
    return engine;
}
test('recommendation does not alter quotes and tutorial market follows identical market movement', () => {
    const normal=market(), tutorial=market();
    const original=structuredClone([...tutorial.stocks.values()]);
    tutorial.getRecommendedTutorialStock({},1000);
    assert.deepEqual([...tutorial.stocks.values()],original);
    const random=Math.random; Math.random=()=>.1;
    try { normal.tick(); tutorial.tick(); } finally { Math.random=random; }
    assert.deepEqual([...tutorial.stocks.values()],[...normal.stocks.values()]);
    assert.ok(tutorial.stocks.get('CLOUDBERRY').price<800);
});
test('wrong stock orders do not debit cash or advance lesson; restrictions end with tutorial', () => {
    const engine=market(); engine.getRecommendedTutorialStock({},1000);
    assert.equal(engine.buyStock('OTHER',1).success,false);
    engine.isLevel10Unlocked=true;
    assert.equal(engine.shortStock('OTHER',1).success,false);
    assert.equal(engine.cash,1000); assert.equal(engine.portfolio.size,0); assert.equal(engine.firstTradeLesson,null);
    assert.equal(engine.buyStock('CLOUDBERRY',1).success,true);
    engine.cash=1000;
    assert.equal(engine.buyStock('OTHER',1).success,false);
    engine.setTutorialActive(false);
    assert.equal(engine.buyStock('OTHER',1).success,true);
});
test('price change immediately before buy replaces recommendation without subsidy or stale fill', () => {
    const engine=market();engine.getRecommendedTutorialStock({},1000);
    engine.stocks.get('CLOUDBERRY').price=1200;
    assert.equal(engine.buyStock('CLOUDBERRY',1).success,false);
    assert.equal(engine.tutorialStockId,'OTHER');assert.equal(engine.cash,1000);
    assert.equal(engine.firstTradeLesson,null); assert.equal(engine.buyStock('OTHER',1).success,true);
});
test('no affordable stock waits without changing cash or prices and recovers when market permits', () => {
    const engine=market();engine.getRecommendedTutorialStock({},1000);
    engine.stocks.forEach(s=>s.price=2000);
    assert.equal(engine.refreshTutorialRecommendation().stock,null);
    assert.equal(engine.cash,1000);assert.equal(engine.tutorialStockId,null);
    assert.equal(engine.buyStock('OTHER',1).success,false);
    engine.stocks.get('OTHER').price=500;
    assert.equal(engine.refreshTutorialRecommendation().stock.id,'OTHER');
    assert.equal(engine.cash,1000);
});
test('periodic review uses ten seconds, updates current dialogue target and rejects wrong completion', () => {
    const engine=market();const ui=Object.create(AnnaTutorial.prototype);
    Object.assign(ui,{ callbacks:{onRefreshRecommendation:()=>engine.refreshTutorialRecommendation(),getMarketState:()=>engine.getState()},
        cleanupHighlights(){},showCurrentStep(){},highlightElement(){},overlay:{classList:{remove(){}}} });
    const interval=globalThis.setInterval,clear=globalThis.clearInterval;let callback,ms,cleared;
    globalThis.setInterval=(fn,delay)=>{callback=fn;ms=delay;return 123;};globalThis.clearInterval=id=>{cleared=id;};
    try {
        ui.start({nickname:'테스터'},engine.getRecommendedTutorialStock({},1000));assert.equal(ms,10000);
        ui.currentStepIdx=ui.steps.findIndex(s=>s.id==='buy_stock');
        engine.stocks.get('CLOUDBERRY').price=1200;callback();
        assert.equal(ui.targetStock.id,'OTHER');assert.match(ui.steps[ui.currentStepIdx].text,/대체주/);
        ui.notifyStockPurchased('CLOUDBERRY');assert.equal(ui.steps[ui.currentStepIdx].id,'buy_stock');
        ui.notifyStockPurchased('OTHER');assert.equal(ui.steps[ui.currentStepIdx].id,'celebrate');assert.equal(cleared,123);
    } finally {globalThis.setInterval=interval;globalThis.clearInterval=clear;}
});
