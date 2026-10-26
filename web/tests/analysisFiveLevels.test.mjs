import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AUTHORED_RUMOR_ITEMS } from '../js/data/rumorCatalog.js';
import { initializeAnalysisGrowth } from '../js/engine/AnalysisGrowth.js';
import { rumorDecryption } from '../js/engine/RumorDecryption.js';
import { buildInterpretationQuestion } from '../js/engine/RumorQuizQuestions.js';

test('v1 growth converts accumulated requirements and current proficiency once, preserving awards and sessions', () => {
    for (const [oldLevel, oldProgress, newLevel, progress, cumulative] of [
        [1, 5, 1, 5, 5], [2, 3, 1, 9, 9], [4, 0, 2, 2, 22],
        [7, 4, 3, 12, 62], [9, 19, 4, 19, 109], [10, 0, 4, 20, 110]
    ]) {
        const awarded = { earned: { at: 123, amount: 1 }, maxClaim: { at: 456, amount: 0 } };
        const quizzes = { event: { key: 'old', attempts: 2, completed: true } };
        const state = { baseStats: { analysis: oldLevel }, analysisGrowth: {
            version: 1, level: oldLevel, proficiency: oldProgress, awarded, quizzes, extra: 'keep'
        } };
        const growth = initializeAnalysisGrowth(state);
        assert.equal(growth.version, 2);
        assert.equal(growth.level, newLevel);
        assert.equal(growth.proficiency, progress);
        assert.equal(growth.migrationV2.cumulative, cumulative);
        assert.equal(growth.awarded, awarded);
        assert.equal(growth.quizzes, quizzes);
        assert.equal(growth.extra, 'keep');
        assert.equal(state.baseStats.analysis, oldLevel);
        const saved = JSON.stringify(state);
        initializeAnalysisGrowth(state);
        assert.equal(JSON.stringify(state), saved);
    }
});

test('five permanent levels unlock interpretation 1/2/3/4/5 and select the corresponding authored band', () => {
    const item = AUTHORED_RUMOR_ITEMS[0];
    for (let level = 1; level <= 5; level++) {
        const decoded = rumorDecryption(item.intelReport, item, level);
        assert.equal(decoded.level, level);
        assert.equal(decoded.text, item.rumorStages[level - 1]);
        assert.equal(decoded.maxLevel, 5);
        const q = buildInterpretationQuestion(item.rumorId, decoded.level, decoded.text);
        assert.ok(q);
        assert.equal(q.choices.length, 3);
    }
    assert.equal(rumorDecryption(item.intelReport, { ...item, interpretationLevel: 5 }, 1).level, 5);
    const legacy = { interpretationLevel: 4, targetStockId: item.targetStockId };
    assert.equal(rumorDecryption('legacy', legacy, 1).level, 4);
});

test('migrated old maximum needs 40 more new correct events; old rewarded events remain ineligible', () => {
    const engine = new ItemEngine({ clock: () => 1000, blackSwanEnabled: false });
    const oldAwards = Object.fromEntries(AUTHORED_RUMOR_ITEMS.slice(0, 110).map(item => [item.rumorId, { amount: 1, at: 1 }]));
    oldAwards[AUTHORED_RUMOR_ITEMS[110].rumorId] = { amount: 0, at: 2 };
    engine.state.analysisGrowth = { version: 1, level: 10, proficiency: 0, awarded: oldAwards, quizzes: {} };
    assert.equal(engine.analysisProgress().remainingToMax, 40);
    const solve = index => {
        const item = { ...structuredClone(AUTHORED_RUMOR_ITEMS[index]), id: `hold-${index}`, isRead: true };
        engine.state.inventory.push(item);
        const q = engine.beginRumorQuiz(item.id);
        const answer = buildInterpretationQuestion(item.rumorId, q.level, q.text).correctIndex;
        return engine.submitRumorQuiz(item.id, q.key, answer);
    };
    assert.equal(solve(0).amount, 0);
    assert.equal(solve(110).amount, 0);
    for (let i = 111; i <= 150; i++) assert.equal(solve(i).amount, 1);
    assert.equal(engine.stats().analysis, 5);
    assert.equal(engine.analysisProgress().remainingToMax, 0);
    assert.equal(engine.analysisProgress().totalCorrect, 150);
    assert.equal(solve(151).amount, 0);
    const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)), blackSwanEnabled: false });
    assert.equal(restored.analysisProgress().level, 5);
    assert.deepEqual(restored.state.analysisGrowth.awarded, engine.state.analysisGrowth.awarded);
});
