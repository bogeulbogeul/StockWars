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

test('full stamina consumes the gift without overflowing; full inventory allows retry', () => {
    const engine = createEngine();
    assert.equal(engine.claimTutorialRecoveryDrink().stored, false);
    assert.equal(engine.state.inventory.length, 0);
    assert.equal(engine.state.stamina, engine.maxStamina());
    const blocked = createEngine();
    blocked.state.stamina = 2;
    blocked.state.inventory = Array.from({ length: 30 }, (_, i) => ({ id: `full_${i}`, quantity: 1 }));
    assert.equal(blocked.claimTutorialRecoveryDrink().success, false);
    assert.equal(blocked.state.tutorialRecoveryDrinkClaimed, undefined);
    assert.equal(blocked.state.stamina, 2);
    blocked.state.inventory.pop();
    assert.equal(blocked.claimTutorialRecoveryDrink().recovered, 1);
});
