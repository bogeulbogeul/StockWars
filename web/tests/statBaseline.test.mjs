import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';

test('all four traits grant one stat point from zero and survive reload without duplication', () => {
    const keys = ['analysis', 'negotiation', 'management', 'recovery'];
    for (const key of keys) {
        const engine = new ItemEngine();
        assert.deepEqual(engine.stats(), Object.fromEntries(keys.map(stat => [stat, 0])));
        const profile = { trait: { key } };
        applyPlayerTrait(engine.state, profile);
        applyPlayerTrait(engine.state, profile);
        const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
        applyPlayerTrait(restored.state, profile);
        assert.deepEqual(restored.stats(), Object.fromEntries(keys.map(stat => [stat, stat === key ? 1 : 0])));
    }
});

test('old baseline is migrated once, preserving growth, experience and missing trait bonus', () => {
    const state = new ItemEngine().state;
    delete state.statSchema;
    state.baseStats = { analysis: 4, management: 2, recovery: 1 };
    state.appliedTrait = 'management';
    state.exp = 170;
    const engine = new ItemEngine({ state });
    applyPlayerTrait(engine.state, { trait: { title: '공격적 자산가' } });
    assert.deepEqual(engine.stats(), { analysis: 3, negotiation: 0, management: 1, recovery: 0 });
    assert.equal(engine.state.exp, 170);
    const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
    applyPlayerTrait(restored.state, { trait: { key: 'management' } });
    assert.deepEqual(restored.stats(), engine.stats());
    const missing = new ItemEngine().state;
    delete missing.statSchema;
    missing.baseStats = { analysis: 1, management: 1, recovery: 1 };
    const repaired = new ItemEngine({ state: missing });
    applyPlayerTrait(repaired.state, { trait: { title: '베테랑 협상가' } });
    assert.deepEqual(repaired.stats(), { analysis: 0, negotiation: 1, management: 0, recovery: 0 });
});
