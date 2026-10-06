import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';

test('tutorial reward is paid once, persisted, excluded for skip, reset for new game', () => {
    const market = { cash: 350, initialCash: 5000 };
    const engine = new ItemEngine({ market });
    assert.equal(engine.claimTutorialReward(true), 0);
    assert.equal(market.cash, 350);
    assert.equal(engine.claimTutorialReward(), 2000);
    assert.equal(market.cash, 2350);
    assert.equal(market.initialCash, 5000);
    assert.equal(engine.claimTutorialReward(), 0);
    const restored = new ItemEngine({ market, state: JSON.parse(JSON.stringify(engine.state)) });
    assert.equal(restored.claimTutorialReward(), 0);
    assert.equal(market.cash, 2350);
    restored.state = new ItemEngine({ market }).state;
    assert.equal(restored.claimTutorialReward(), 2000);
});

test('duplicate completion and later labor do not reopen a completed or skipped tutorial', () => {
    let completed = 0;
    const tutorial = Object.assign(Object.create(AnnaTutorial.prototype), {
        isActive: true, callbacks: { onComplete: () => completed++ },
        steps: [{ id: 'rumor_inventory_guide' }], overlay: { classList: { add() {} } },
        cleanupHighlights() {}, tryShowLesson() {}
    });
    tutorial.complete();
    tutorial.complete();
    tutorial.notifyLogisticsJobCompleted({});
    assert.equal(completed, 1);
    assert.equal(tutorial.isActive, false);
    tutorial.isActive = true;
    tutorial.complete(true);
    tutorial.notifyLogisticsJobCompleted({});
    assert.equal(completed, 2);
    assert.equal(tutorial.isActive, false);
});