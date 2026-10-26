import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';

test('all personality profiles leave ability data untouched, including old title-only profiles', () => {
    for (const key of ['analysis','negotiation','management','recovery']) {
        const engine = new ItemEngine();
        const before = structuredClone(engine.state);
        const profile = { trait: { key, title: '이전 투자 성향' } };
        applyPlayerTrait(engine.state, profile); applyPlayerTrait(engine.state, profile);
        assert.deepEqual(engine.state, before);
        assert.deepEqual(engine.stats(), { analysis: 1 });
        assert.equal(engine.portfolioSlots(), Infinity);
        assert.equal(engine.maxStamina(), 3);
        assert.equal(engine.feeRate(0.0015), 0.0015);
        assert.equal(engine.laborReward(800), 800);
    }
});

test('pre-schema saves preserve raw stats and old personality without subtracting points', () => {
    const state = new ItemEngine().state;
    delete state.statSchema; delete state.abilityRetirementVersion;
    delete state.analysisGrowth;
    state.baseStats = { analysis: 4, management: 2, recovery: 1 };
    state.appliedTrait = 'management'; state.exp = 170;
    const before = structuredClone(state.baseStats);
    const engine = new ItemEngine({ state });
    assert.deepEqual(state.baseStats, before);
    assert.equal(state.appliedTrait, 'management');
    assert.equal(state.exp, 170);
    assert.deepEqual(engine.stats(), { analysis: 4 });
    assert.deepEqual(new ItemEngine({ state: structuredClone(state) }).stats(), engine.stats());
});
