import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';
import { PersonalityTestStep } from '../js/components/character/PersonalityTestStep.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';

test('personality result retains its key without creating or repairing ability bonuses', () => {
    let trait;
    const step = new PersonalityTestStep({}, { onEvaluated: result => { trait = result; } });
    step.scores.management = 3;
    step.evaluate();
    assert.equal(trait.key, 'management');
    const engine = new ItemEngine();
    const profile = { trait: { title: '공격적 자산가' } };
    applyPlayerTrait(engine.state, profile);
    assert.equal(engine.stats().management, undefined);
    assert.equal(profile.trait.key, undefined);
    applyPlayerTrait(engine.state, profile);
    assert.equal(engine.stats().management, undefined);
    const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
    applyPlayerTrait(restored.state, profile);
    assert.equal(restored.stats().management, undefined);
    const previouslyCorrect = new ItemEngine();
    previouslyCorrect.state.baseStats.management = 2;
    applyPlayerTrait(previouslyCorrect.state, { trait });
    assert.equal(previouslyCorrect.state.baseStats.management, 2);
});
