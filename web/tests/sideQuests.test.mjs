import test from 'node:test';
import assert from 'node:assert/strict';
import { SideQuestEngine } from '../js/engine/SideQuestEngine.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';

test('legacy accepted, completed and claimed quests cannot progress or pay out after reload', () => {
    const market = { cash: 1000 };
    const initial = new ItemEngine({ market }).state;
    initial.exp = 200;
    initial.sideQuests = {
        challenge_net_profit_v1: { accepted: true, count: 1000, completed: true },
        challenge_profit_streak_v1: { accepted: true, count: 2 },
        challenge_agent_k_v1: { accepted: true, completed: true, claimed: true }
    };
    initial.equippedTitle = 'challenge_agent_k_v1';
    const items = new ItemEngine({ market, state: JSON.parse(JSON.stringify(initial)) });
    const before = JSON.stringify(items.state);
    const quests = new SideQuestEngine(() => items.state, market);
    assert.deepEqual(quests.list(), []);
    assert.deepEqual(quests.active(), []);
    for (const giver of ['anna', 'park', 'agent_k']) assert.deepEqual(quests.offers(giver), []);
    for (const id of Object.keys(initial.sideQuests)) {
        assert.equal(quests.accept(id, 'anna').success, false);
        assert.equal(quests.claim(id).success, false);
    }
    assert.equal(quests.record('trade', { side: 'sell', quantity: 1, profit: 2000 }), false);
    assert.equal(quests.record('arena', { opponent: '토리', completed: true, playerAssets: 200, opponentAssets: 100 }), false);
    assert.equal(quests.record('labor', { score: 100, brokenCount: 0 }), false);
    assert.equal(market.cash, 1000);
    assert.equal(JSON.stringify(items.state), before);
});
