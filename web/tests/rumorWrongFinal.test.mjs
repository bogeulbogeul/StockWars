import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AUTHORED_RUMOR_ITEMS as items } from '../js/data/rumorCatalog.js';
import { buildInterpretationQuestion as build } from '../js/engine/RumorQuizQuestions.js';

test('wrong reveals answer immediately and blocks rewards across copies, stages and reload', () => {
    let engine = new ItemEngine({ blackSwanEnabled: false });
    const item = { ...structuredClone(items[0]), id: 'first', isRead: true };
    engine.state.inventory.push(item);
    const quiz = engine.beginRumorQuiz(item.id);
    const correct = build(item.rumorId, quiz.level, quiz.text).correctIndex;
    const result = engine.submitRumorQuiz(item.id, quiz.key, (correct + 1) % 3);
    assert.equal(result.correct, false);
    assert.equal(result.concluded, true);
    assert.equal(result.correctIndex, correct);
    assert.equal(result.answer, quiz.choices[correct]);
    assert.ok(result.explanation);
    assert.equal(result.amount, 0);
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)), blackSwanEnabled: false });
    for (let level = 1; level <= 5; level++) {
        const copy = { ...structuredClone(items[0]), id: `copy-${level}`, isRead: true, interpretationLevel: level };
        engine.state.inventory.push(copy);
        const q = engine.beginRumorQuiz(copy.id);
        assert.equal(q.resolution.concluded, true);
        const answer = build(copy.rumorId, q.level, q.text).correctIndex;
        assert.equal(engine.submitRumorQuiz(copy.id, q.key, answer).amount, 0);
    }
    assert.equal(engine.analysisProgress().current, 0);
    assert.equal(engine.analysisProgress().totalCorrect, 0);
});

test('historic paid awards survive incorrect review; postponing and invalid input do not forfeit rewards', () => {
    const engine = new ItemEngine({ blackSwanEnabled: false });
    const item = { ...structuredClone(items[0]), id: 'first', isRead: true };
    engine.state.inventory.push(item);
    const q = engine.beginRumorQuiz(item.id);
    assert.equal(engine.submitRumorQuiz(item.id, q.key, -1).success, false);
    assert.equal(engine.state.analysisGrowth.awarded[item.rumorId], undefined);
    const answer = build(item.rumorId, q.level, q.text).correctIndex;
    assert.equal(engine.submitRumorQuiz(item.id, q.key, answer).amount, 1);
    const award = structuredClone(engine.state.analysisGrowth.awarded[item.rumorId]);
    engine.submitRumorQuiz(item.id, q.key, (answer + 1) % 3);
    assert.deepEqual(engine.state.analysisGrowth.awarded[item.rumorId], award);
    assert.equal(engine.analysisProgress().current, 1);
});
