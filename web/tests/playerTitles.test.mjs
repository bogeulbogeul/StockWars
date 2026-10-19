import test from 'node:test';
import assert from 'node:assert/strict';
import { SideQuestEngine } from '../js/engine/SideQuestEngine.js';
import { titleName, PLAYER_TITLES } from '../js/data/playerTitles.js';
import { existsSync } from 'node:fs';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';

test('titles require claimed rewards, persist selection and recover legacy claims without repaying', () => {
    let state = { sideQuests: { challenge_net_profit_v1: { accepted: true, claimed: true } } };
    const market = { cash: 0 };
    const engine = new SideQuestEngine(() => state, market);
    const id = 'challenge_profit_streak_v1';
    assert.equal(engine.equipTitle(id).success, false);
    engine.accept(id, 'anna');
    for (let i = 0; i < 3; i++) engine.record('trade', { side: 'sell', quantity: 1, profit: 100 });
    assert.equal(engine.equipTitle(id).success, false);
    assert.equal(engine.claim(id).success, true);
    assert.equal(engine.equippedTitle(), id);
    state = JSON.parse(JSON.stringify(state));
    assert.equal(engine.equippedTitle(), id);
    assert.equal(engine.claim(id).success, false);
    assert.equal(market.cash, 400);
    assert.equal(engine.equipTitle(null).success, true);
    assert.equal(engine.equippedTitle(), null);
    delete state.equippedTitle;
    assert.equal(engine.equipTitle(id).success, true);
    assert.equal(engine.equipTitle('unknown').success, false);
    state = {};
    assert.equal(engine.equippedTitle(), null);
});

test('every title has localized text and a shipped language-neutral image', () => {
    for (const [id, title] of Object.entries(PLAYER_TITLES)) {
        assert.ok(titleName(id, 'ko-KR'));
        assert.ok(titleName(id, 'en-US'));
        assert.equal(titleName(id, 'ja'), title.names.en);
        assert.ok(existsSync(new URL(`../assets/titles/${title.image}`, import.meta.url)));
    }
});

test('starting trait grants only its own title, migrates old profiles and never changes stats when equipped', () => {
    for (const key of ['analysis', 'negotiation', 'management', 'recovery']) {
        const state = { baseStats: { analysis: 0, negotiation: 0, management: 0, recovery: 0 } };
        const profile = { trait: { key } };
        applyPlayerTrait(state, profile);
        const engine = new SideQuestEngine(() => state, { cash: 0 });
        assert.equal(engine.equippedTitle(), `trait_${key}`);
        assert.equal(engine.titleCollection().length, 7);
        assert.equal(engine.titleCollection().filter(title => title.claimed).length, 1);
        for (const other of ['analysis', 'negotiation', 'management', 'recovery'].filter(k => k !== key)) {
            assert.equal(engine.equipTitle(`trait_${other}`).success, false);
        }
        const stats = { ...state.baseStats };
        engine.equipTitle(null);
        applyPlayerTrait(state, profile);
        assert.equal(engine.equippedTitle(), null);
        engine.equipTitle(`trait_${key}`);
        assert.deepEqual(state.baseStats, stats);
        delete state.equippedTitle;
        applyPlayerTrait(state, profile);
        assert.equal(engine.equippedTitle(), `trait_${key}`);
        assert.deepEqual(state.baseStats, stats);
    }
});
