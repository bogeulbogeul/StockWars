import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';

const createEngine = state => new ItemEngine({ market: { cash: 5000 }, state, blackSwanEnabled: false });

test('Anna gift restores one heart immediately without spending cash or existing drinks; cannot repeat after restore', () => {
    const engine = createEngine();
    engine.state.stamina = 1;
    engine.add('item_energy_drink', 2);
    const result = engine.claimTutorialRecoveryDrink();
    assert.equal(result.success, true);
    assert.equal(result.recovered, 1);
    assert.equal(engine.state.stamina, 2);
    assert.equal(engine.state.inventory[0].quantity, 2);
    assert.equal(engine.market.cash, 5000);
    const restored = createEngine(JSON.parse(JSON.stringify(engine.state)));
    restored.claimTutorialRecoveryDrink();
    assert.equal(restored.state.stamina, 2);
    assert.equal(restored.state.inventory[0].quantity, 2);
    assert.equal(createEngine().state.tutorialRecoveryDrinkClaimed, undefined);
});

test('full stamina keeps the gift and full inventory allows retry without claiming', () => {
    const engine = createEngine();
    assert.equal(engine.claimTutorialRecoveryDrink().stored, true);
    assert.equal(engine.state.inventory[0].quantity, 1);
    const blocked = createEngine();
    blocked.state.stamina = 2;
    blocked.state.inventory = Array.from({ length: 24 }, (_, i) => ({ id: `full_${i}`, quantity: 1 }));
    assert.equal(blocked.claimTutorialRecoveryDrink().success, false);
    assert.equal(blocked.state.tutorialRecoveryDrinkClaimed, undefined);
    assert.equal(blocked.state.stamina, 2);
    blocked.state.inventory.pop();
    assert.equal(blocked.claimTutorialRecoveryDrink().recovered, 1);
});

test('recovery waits for explicit gift action and successful use, then explains recovery and bench', () => {
    const engine = createEngine();
    engine.state.stamina = 2;
    let enabled = false, calls = 0, advanced = 0;
    const steps = buildAnnaScenario({ callbacks: { onTutorialRecoveryDrink: () => {
        calls++;
        return enabled ? engine.claimTutorialRecoveryDrink() : { success: false };
    } } });
    const index = steps.findIndex(step => step.id === 'stamina_recovery_guide');
    const ui = Object.assign(Object.create(AnnaTutorial.prototype), {
        steps, currentStepIdx: index, historyCursor: null, isTyping: false,
        nextStep() { advanced++; }
    });
    ui.handleAdvance();
    assert.equal(calls, 0);
    ui.handleActionClick();
    assert.equal(advanced, 0);
    enabled = true;
    ui.handleActionClick();
    assert.equal(advanced, 1);
    assert.match(steps[index + 1].text, /하트 1개.*회복/);
    assert.equal(steps[index + 2].id, 'stamina_bench_guide');
    ui.historyCursor = index - 1;
    ui.handleActionClick();
    assert.equal(calls, 2);
});
