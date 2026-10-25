import test from 'node:test';
import assert from 'node:assert/strict';
import { SideQuestEngine } from '../js/engine/SideQuestEngine.js';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';

test('starting traits grant neither ability bonuses nor titles', () => {
    for (const key of ['analysis', 'negotiation', 'management', 'recovery']) {
        const state = { baseStats: { analysis: 0, negotiation: 0, management: 0, recovery: 0 } };
        applyPlayerTrait(state, { trait: { key } });
        assert.equal(state.baseStats[key], 0);
        assert.equal(state.appliedTrait, undefined);
        assert.equal(Object.hasOwn(state, 'equippedTitle'), false);
        applyPlayerTrait(state, { trait: { key } });
        assert.equal(state.baseStats[key], 0);
    }
});

test('legacy titles remain stored but cannot be displayed or equipped', () => {
    const state = { baseStats: { analysis: 1 }, appliedTrait: 'analysis', equippedTitle: 'trait_analysis' };
    const before = JSON.stringify(state);
    applyPlayerTrait(state, { trait: { key: 'analysis' } });
    const engine = new SideQuestEngine(() => state, { cash: 100 });
    assert.deepEqual(engine.titleCollection(), []);
    assert.equal(engine.equippedTitle(), null);
    assert.equal(engine.ownsTitle('trait_analysis'), false);
    for (const id of ['trait_analysis', 'challenge_net_profit_v1', null]) assert.equal(engine.equipTitle(id).success, false);
    assert.equal(JSON.stringify(state), before);
});
