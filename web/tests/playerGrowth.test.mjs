import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { initializePlayerGrowth, playerLevelProgress } from '../js/engine/PlayerGrowth.js';

test('new characters need 150 EXP for level 2 and retain activity rewards', () => {
    const engine = new ItemEngine({ market: { cash: 0 } });
    engine.finishLabor(100, 100);
    assert.deepEqual(engine.playerLevelProgress(), { level: 1, currentExp: 100, maxExp: 150 });
    engine.finishLabor(100, 50);
    assert.equal(engine.playerLevel(), 2);
    assert.equal(engine.state.exp, 150);
    assert.equal(engine.market.cash, 200);
});

test('old saves preserve every level and progress ratio; reload never converts twice', () => {
    let oldFloor = 0;
    for (let level = 1; level <= 20; level++) {
        const oldRequired = 100 * level ** 1.5;
        const oldExp = oldFloor + oldRequired * 0.37;
        const state = new ItemEngine().state;
        delete state.playerExpCurveVersion;
        state.exp = oldExp;
        const engine = new ItemEngine({ state });
        const progress = engine.playerLevelProgress();
        assert.equal(progress.level, level);
        if (level < 20) assert.ok(Math.abs(progress.currentExp / progress.maxExp - 0.37) < 1e-10);
        else assert.equal(progress.maxExp, null);
        const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(state)) });
        assert.equal(restored.state.exp, oldExp * 1.5);
        assert.deepEqual(restored.playerLevelProgress(), progress);
        oldFloor += oldRequired;
    }
});

test('invalid experience normalizes to zero', () => {
    for (const exp of [-1, NaN, Infinity, 'invalid']) {
        const state = { exp };
        initializePlayerGrowth(state);
        assert.deepEqual(playerLevelProgress(state), { level: 1, currentExp: 0, maxExp: 150 });
    }
});

test('exact old level boundaries retain their levels after conversion', () => {
    let exp = 0;
    for (let level = 1; level <= 20; level++) {
        const state = { exp };
        initializePlayerGrowth(state);
        assert.equal(playerLevelProgress(state).level, level);
        exp += 100 * level ** 1.5;
    }
});
