import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { AUTHORED_RUMOR_ITEMS as items } from '../js/data/rumorCatalog.js';
import { buildInterpretationQuestion } from '../js/engine/RumorQuizQuestions.js';

test('all ten prior powder levels round up to retained information; inventory/mail/delivery migrate once', () => {
    const engine = new ItemEngine({ blackSwanEnabled: false });
    const oldStages = Array.from({ length: 10 }, (_, i) => `old ${i + 1}`);
    const old = level => ({ ...structuredClone(items[0]), id: `old-${level}`, rumorSchema: 2,
        rumorStages: [...oldStages], interpretationLevel: level, intelReport: 'old full', isRead: true, price: 777 });
    engine.state.inventory = Array.from({ length: 10 }, (_, i) => old(i + 1));
    engine.state.deliveries.push({ item: old(7) });
    engine.state.mail.push({ payload: old(10) });
    engine.state.analysisGrowth.awarded[items[0].rumorId] = { amount: 1, at: 5 };
    const awards = structuredClone(engine.state.analysisGrowth.awarded);
    const restored = new ItemEngine({ state: structuredClone(engine.state), blackSwanEnabled: false });
    assert.deepEqual(restored.state.inventory.map(i => i.interpretationLevel), [1, 2, 2, 2, 3, 3, 4, 4, 5, 5]);
    for (const item of restored.state.inventory) {
        assert.equal(item.rumorSchema, 3);
        assert.deepEqual(item.rumorStages, items[0].rumorStages);
        assert.deepEqual(item.rumorTenStageArchive.rumorStages, oldStages);
        assert.equal(item.price, 777);
    }
    assert.equal(restored.state.deliveries[0].item.interpretationLevel, 4);
    assert.equal(restored.state.mail[0].payload.interpretationLevel, 5);
    assert.deepEqual(restored.state.analysisGrowth.awarded, awards);
    const save = JSON.stringify(restored.state);
    const again = new ItemEngine({ state: JSON.parse(save), blackSwanEnabled: false });
    assert.equal(JSON.stringify(again.state), save);
    const quiz = again.beginRumorQuiz('old-10');
    const answer = buildInterpretationQuestion(items[0].rumorId, quiz.level, quiz.text).correctIndex;
    assert.equal(again.submitRumorQuiz('old-10', quiz.key, answer).amount, 0);
});
