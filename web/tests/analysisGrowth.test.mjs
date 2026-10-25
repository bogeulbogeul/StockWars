import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AUTHORED_RUMOR_ITEMS } from '../js/data/rumorCatalog.js';
import { buildInterpretationQuestion } from '../js/engine/RumorQuizQuestions.js';
import { ANALYSIS_REQUIREMENTS } from '../js/engine/AnalysisGrowth.js';
import { AUTHORED_RUMOR_QUIZZES } from '../js/data/authoredRumorQuizzes.js';

const fixture = (level = 1) => {
    const state = new ItemEngine().state;
    delete state.analysisGrowth;
    state.baseStats.analysis = level;
    const engine = new ItemEngine({ state, clock: () => 1000, blackSwanEnabled: false });
    return engine;
};
const hold = (engine, index = 0, level = 1, id = `holding-${index}`) => {
    const item = { ...structuredClone(AUTHORED_RUMOR_ITEMS[index]), id, interpretationLevel: level, isRead: true };
    engine.state.inventory.push(item); return item;
};
const solve = (engine, item, wrongFirst = false) => {
    const quiz = engine.beginRumorQuiz(item.id);
    assert.ok(quiz.success);
    const correct = buildInterpretationQuestion(item.rumorId, quiz.level, quiz.text).correctIndex;
    return engine.submitRumorQuiz(item.id, quiz.key, correct);
};

test('150 distinct correct events promote at 20,50,90,150; character EXP unchanged', () => {
    const engine = fixture();
    const thresholds = [20, 50, 90, 150];
    for (let count = 1; count <= 150; count++) {
        const result = solve(engine, hold(engine, count - 1), count % 2 === 0);
        assert.equal(result.amount, 1);
        const expected = 1 + thresholds.filter(n => count >= n).length;
        assert.equal(engine.stats().analysis, expected);
        assert.equal(engine.analysisProgress().remainingToMax, 150 - count);
    }
    assert.equal(engine.state.exp, 0);
    assert.equal(engine.state.baseStats.analysis, 1);
    assert.equal(engine.analysisProgress().totalCorrect, 150);
    assert.equal(solve(engine, hold(engine, 150)).amount, 0);
    assert.equal(engine.analysisProgress().current, 0);
});

test('copied/gifted holdings, powder upgrades, replay and reload never repay the same event', () => {
    let engine = fixture();
    const first = hold(engine), copy = hold(engine, 0, 5, 'gift-copy');
    assert.equal(solve(engine, first, true).amount, 1);
    assert.equal(solve(engine, copy).amount, 0);
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)), clock: () => 1000, blackSwanEnabled: false });
    assert.equal(solve(engine, engine.state.inventory[1]).amount, 0);
    engine.state.inventory.splice(0);
    assert.equal(solve(engine, hold(engine, 0, 5, 'repurchased')).amount, 0);
    assert.equal(engine.analysisProgress().totalCorrect, 1);
    assert.equal(engine.analysisProgress().current, 1);
});

test('unread, legacy, forged, deleted and invalid/stale submissions give no reward', () => {
    const engine = fixture();
    const item = hold(engine);
    item.isRead = false; assert.equal(engine.beginRumorQuiz(item.id).success, false);
    item.isRead = true;
    const quiz = engine.beginRumorQuiz(item.id);
    assert.equal(engine.submitRumorQuiz(item.id, quiz.key, -1).success, false);
    assert.equal(engine.submitRumorQuiz(item.id, quiz.key, 1.2).success, false);
    item.interpretationLevel = 5;
    const updated = engine.beginRumorQuiz(item.id);
    assert.notEqual(updated.key, quiz.key);
    assert.equal(engine.submitRumorQuiz(item.id, quiz.key, 0).success, false);
    engine.state.inventory.splice(0);
    assert.equal(engine.submitRumorQuiz(item.id, updated.key, 0).success, false);
    engine.state.inventory.push({ id: 'old', isRead: true, quantity: 1, category: 'intel', targetStockId: 'CLOUDBERRY' });
    assert.equal(engine.beginRumorQuiz('old').success, false);
    const fake = hold(engine); fake.rumorId = 'invented';
    assert.equal(engine.beginRumorQuiz(fake.id).success, false);
    assert.equal(engine.analysisProgress().current, 0);
});

test('wrong result persists after reload and permanently blocks the event reward', () => {
    let engine = fixture();
    const item = hold(engine);
    const quiz = engine.beginRumorQuiz(item.id);
    const answer = buildInterpretationQuestion(item.rumorId, quiz.level, quiz.text).correctIndex;
    engine.submitRumorQuiz(item.id, quiz.key, (answer + 1) % 3);
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)), clock: () => 1000, blackSwanEnabled: false });
    assert.equal(engine.beginRumorQuiz(item.id).key, quiz.key);
    assert.equal(engine.submitRumorQuiz(item.id, quiz.key, answer).amount, 0);
    assert.equal(engine.submitRumorQuiz(item.id, quiz.key, answer).amount, 0);
    assert.equal(engine.state.analysisGrowth.quizzes[item.rumorId].attempts, 1);
});

test('starting levels preserve old numeric ownership and require 130/100 distinct answers', () => {
    for (const [level, needed] of [[2, 130], [3, 100]]) {
        const engine = fixture(level);
        assert.equal(engine.analysisProgress().remainingToMax, needed);
        assert.equal(engine.analysisProgress().totalCorrect, 0);
        assert.equal(engine.state.baseStats.analysis, level);
        for (let i = 0; i < needed; i++) solve(engine, hold(engine, i));
        assert.equal(engine.stats().analysis, 5);
    }
    const engine = fixture(20);
    assert.equal(engine.stats().analysis, 5);
    assert.equal(engine.state.baseStats.analysis, 20);
    assert.deepEqual(ANALYSIS_REQUIREMENTS.slice(1, 5), [20, 30, 40, 60]);
});

test('all 1440 displayed stages select the authored question for their exact stage with visible evidence', () => {
    const positions = new Set();
    for (const item of AUTHORED_RUMOR_ITEMS) for (let level = 1; level <= 5; level++) {
        const text = item.rumorStages[level - 1];
        const question = buildInterpretationQuestion(item.rumorId, level, text);
        assert.equal(question.choices.length, 3);
        assert.equal(new Set(question.choices).size, 3);
        assert.ok(text.includes(question.evidence));
        const authored = AUTHORED_RUMOR_QUIZZES.find(entry => entry.eventId === item.rumorId
            && entry.minLevel === level);
        assert.equal(question.question, authored.question);
        assert.deepEqual(question.choices, authored.choices);
        assert.equal(question.correctIndex, authored.correctIndex);
        assert.equal(question.explanation, authored.explanation);
        positions.add(question.correctIndex);
        const engine = fixture();
        const held = hold(engine, AUTHORED_RUMOR_ITEMS.indexOf(item), level);
        const visible = engine.beginRumorQuiz(held.id);
        assert.equal('correctIndex' in visible, false);
        assert.equal(visible.text, item.rumorStages[level - 1]);
        if (level < 2) assert.ok(!JSON.stringify(visible.choices).includes(item.targetStockName));
    }
    assert.equal(positions.size, 3);
});

test('point allocation and legacy report decryptions cannot bypass quiz-only growth', () => {
    const engine = fixture();
    engine.state.exp = 1000;
    const points = engine.pendingStatPoints();
    assert.equal(engine.allocateLevelStat('analysis').success, false);
    assert.equal(engine.pendingStatPoints(), points);
    engine.state.reports.push({ id: 'old', parts: Array(6).fill('기존 자료'), revealed: 3 });
    engine.state.decryptions = 99;
    engine.add('item_darknet_key');
    assert.ok(engine.use('item_darknet_key').success);
    assert.equal(engine.stats().analysis, 1);
    assert.equal(engine.state.baseStats.analysis, 1);
});
