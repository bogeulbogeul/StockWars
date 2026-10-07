import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';

test('developer level button advances one level, grants choices, persists and stops at cap', () => {
    let engine = new ItemEngine();
    engine.state.exp = 70;
    assert.equal(engine.addDeveloperLevel().success, true);
    assert.equal(engine.state.exp, 100);
    assert.equal(engine.playerLevel(), 2);
    assert.equal(engine.pendingStatPoints(), 1);
    engine.allocateLevelStat('analysis');
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
    for (let level = 3; level <= 20; level++) {
        assert.equal(engine.addDeveloperLevel().success, true);
        assert.equal(engine.playerLevel(), level);
        assert.equal(engine.pendingStatPoints(), level - 2);
    }
    const exp = engine.state.exp;
    assert.equal(engine.addDeveloperLevel().success, false);
    assert.equal(engine.state.exp, exp);
    assert.equal(engine.state.baseStats.analysis, 1);
});
