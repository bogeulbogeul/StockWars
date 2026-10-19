import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';

test('tutorial reward is equal for skip and completion, paid once and persisted', () => {
    const market = { cash: 350, initialCash: 5000 };
    const engine = new ItemEngine({ market });
    assert.equal(engine.claimTutorialReward(true), 2000);
    assert.equal(engine.claimTutorialReward(), 0);
    assert.equal(market.cash, 2350);
    assert.equal(market.initialCash, 5000);
    assert.equal(engine.claimTutorialReward(), 0);
    const restored = new ItemEngine({ market, state: JSON.parse(JSON.stringify(engine.state)) });
    assert.equal(restored.claimTutorialReward(), 0);
    assert.equal(market.cash, 2350);
    restored.state = new ItemEngine({ market }).state;
    assert.equal(restored.claimTutorialReward(), 2000);
});

test('duplicate completion  do not reopen a completed or skipped tutorial', () => {
    let completed = 0;
    const tutorial = Object.assign(Object.create(AnnaTutorial.prototype), {
        isActive: true, callbacks: { onComplete: () => completed++ },
        steps: [{ id: 'rumor_inventory_guide' }], overlay: { classList: { add() {}, remove() {} } },
        cleanupHighlights() {}, tryShowLesson() {}
    });
    tutorial.complete();
    tutorial.complete();
    assert.equal(completed, 1);
    assert.equal(tutorial.isActive, false);
    tutorial.isActive = true;
    tutorial.complete(true);
    assert.equal(completed, 2);
    assert.equal(tutorial.isActive, false);
});
