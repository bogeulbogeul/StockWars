import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ItemEngine } from '../js/engine/ItemEngine.js';

test('level gains and reload never grant or spend ability points', () => {
    const engine = new ItemEngine({ market: { cash: 0 } });
    const before = structuredClone(engine.state.baseStats);
    engine.finishLabor(0, 600);
    assert.equal(engine.playerLevel(), 3);
    assert.equal(engine.pendingStatPoints(), 0);
    for (const key of ['analysis','negotiation','management','recovery','invalid']) {
        assert.equal(engine.allocateLevelStat(key).success, false);
    }
    assert.deepEqual(engine.state.baseStats, before);
    engine.state.exp = 1e9;
    const restored = new ItemEngine({ state: structuredClone(engine.state) });
    assert.equal(restored.playerLevel(), 20);
    assert.equal(restored.pendingStatPoints(), 0);
    assert.deepEqual(restored.stats(), { analysis: 1 });
});

test('legacy earned stats and spent/unspent point history survive retirement and reload', () => {
    const state = structuredClone(new ItemEngine().state);
    delete state.abilityRetirementVersion; delete state.legacyAbilities;
    state.exp = 600; state.spentLevelPoints = 1;
    state.baseStats = { analysis: 3, negotiation: 4, management: 5, recovery: 5 };
    state.appliedTrait = 'management'; state.stamina = 5;
    state.buffs = { management: Date.now() + 60000, recovery: Date.now() + 60000 };
    const original = structuredClone(state);
    const engine = new ItemEngine({ state });
    assert.equal(engine.pendingStatPoints(), 0);
    assert.equal(state.legacyAbilities.unspentLevelPoints, 1);
    assert.equal(state.legacyAbilities.stamina, 5);
    assert.deepEqual(state.baseStats, original.baseStats);
    assert.equal(state.spentLevelPoints, 1);
    assert.equal(state.appliedTrait, 'management');
    assert.deepEqual(state.buffs, original.buffs);
    assert.equal(engine.maxStamina(), 3);
    assert.equal(engine.portfolioSlots(), Infinity);
    const restored = new ItemEngine({ state: structuredClone(state) });
    assert.deepEqual(restored.state.legacyAbilities, state.legacyAbilities);
});

test('live gameplay does not import point allocation UI or personality stat grants', () => {
    const source = readFileSync(new URL('../js/app/ItemGameplay.js', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /LevelUpNotice|allocateLevelStat|pendingStatPoints|applyPlayerTrait/);
});
