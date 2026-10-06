import test from 'node:test';
import assert from 'node:assert/strict';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';
marketEngine.stopEngine();
function market() {
    const engine = new MarketEngine();
    engine.stopEngine();
    engine.stocks.set('TEST', { id: 'TEST', name: '테스트', price: 1000, prevPrice: 1000 });
    engine.isTutorialActive = true;
    return engine;
}
function tutorial(engine, active = true) {
    const ui = Object.create(AnnaTutorial.prototype);
    Object.assign(ui, {
        callbacks: { getFirstTradeLesson: () => engine.firstTradeLesson, getMarketState: () => engine.getState() },
        steps: [{ id: 'original' }, { id: 'next' }], currentStepIdx: 0,
        isActive: active, overlay: { classList: { add() {}, remove() {} } },
        showCurrentStep() {}, cleanupHighlights() {}, finishTyping() {}
    });
    return ui;
}
test('5% threshold uses first successful execution, not subsequent average or leveraged return', () => {
    const engine = market();
    engine.cash = 0;
    assert.equal(engine.buyStock('TEST', 1).success, false);
    assert.equal(engine.firstTradeLesson, null);
    engine.cash = 10000;
    engine.isLevel10Unlocked = true;
    engine.buyStock('TEST', 1, 2);
    engine.stocks.get('TEST').price = 1049;
    engine.buyStock('TEST', 1, 2);
    assert.equal(engine.firstTradeLesson.buyPrice, 1000);
    assert.equal(engine.firstTradeLesson.status, 'watching');
    engine.stocks.get('TEST').price = 1050;
    engine.notify();
    assert.equal(engine.firstTradeLesson.status, 'ready');
    engine.firstTradeLesson.status = 'holding';
    engine.notify();
    assert.equal(engine.firstTradeLesson.status, 'holding');
});
test('choice waits for dialogue boundary and holding resumes without rewards or duplicate alert', () => {
    const engine = market();
    engine.buyStock('TEST', 1);
    const ui = tutorial(engine);
    engine.stocks.get('TEST').price = 1050;
    engine.notify();
    ui.notifyMarketUpdated(engine.getState());
    assert.equal(ui.steps[0].id, 'original');
    ui.nextStep();
    assert.equal(ui.steps[0].id, 'first_profit_choice');
    assert.equal(ui.steps[0].allowHold, true);
    const cash = engine.cash;
    ui.complete(true);
    assert.equal(engine.firstTradeLesson.status, 'holding');
    assert.equal(ui.steps[ui.currentStepIdx].id, 'next');
    assert.equal(engine.cash, cash);
    ui.notifyMarketUpdated(engine.getState());
    assert.equal(ui.steps[0].id, 'original');
});
test('sell choice does not auto-trade; later actual loss is explained once', () => {
    const engine = market();
    engine.buyStock('TEST', 1);
    engine.firstTradeLesson.status = 'ready';
    const ui = tutorial(engine, false);
    ui.tryShowLesson();
    ui.steps[0].onAction();
    assert.equal(ui.steps[0].id, 'first_sell_guide');
    assert.equal(engine.getPortfolioList()[0].qty, 1);
    engine.firstTradeLesson.status = 'holding';
    ui.finishLesson();
    engine.stocks.get('TEST').price = 900;
    assert.deepEqual(engine.getSellPreview('TEST', 10), { quantity: 1, proceeds: 900, profit: -100 });
    engine.sellStock('TEST', 10);
    ui.notifyMarketUpdated(engine.getState());
    assert.equal(ui.steps[0].id, 'first_sale_result');
    assert.match(ui.steps[0].text, /-100G/);
    ui.complete();
    assert.equal(engine.firstTradeLesson.status, 'done');
    ui.notifyMarketUpdated(engine.getState());
    assert.equal(ui.isActive, false);
});
test('failed sale does not advance a restored holding lesson', () => {
    const engine = market();
    engine.buyStock('TEST', 1);
    engine.firstTradeLesson.status = 'holding';
    const restored = market();
    restored.firstTradeLesson = JSON.parse(JSON.stringify(engine.firstTradeLesson));
    assert.equal(restored.sellStock('TEST', 1).success, false);
    assert.equal(restored.firstTradeLesson.status, 'holding');
    assert.equal(tutorial(restored, false).tryShowLesson(), false);
});
