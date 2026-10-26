import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUTHORED_RUMOR_QUIZZES as bank } from '../js/data/authoredRumorQuizzes.js';
import { AUTHORED_RUMOR_ITEMS as events } from '../js/data/rumorCatalog.js';
import { buildInterpretationQuestion as build } from '../js/engine/RumorQuizQuestions.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';

test('1440 authored entries exactly preserve manuscript questions, choices, answers, explanations and evidence', () => {
    assert.equal(bank.length, 1440);
    assert.equal(new Set(bank.map(q => q.id)).size, 1440);
    assert.equal(new Set(bank.map(q => q.eventId)).size, 288);
    const docs = new Map();
    for (const q of bank) {
        const [, company] = q.eventId.split('_');
        const sector = /from '\.\/rumorQuizzes\/([^/]+)\//;
        const index = readFileSync(new URL('../js/data/authoredRumorQuizzes.js', import.meta.url), 'utf8');
        const line = index.split('\n').find(row => row.includes(`/${company}.js`));
        const path = `../../Docs/RumorQuizzes/${line.match(sector)[1]}/${company}.md`;
        if (!docs.has(path)) docs.set(path, readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
        const block = docs.get(path).split(`문항 ID: \`${q.id}\``)[1].split('### ')[0];
        assert.ok(block.includes(`\n\n${q.question}\n\n`));
        q.choices.forEach((choice, i) => assert.ok(block.includes(`${i + 1}. ${choice}\n`)));
        assert.ok(block.includes(`**정답: ${'①②③'[q.correctIndex]}**`));
        assert.ok(block.includes(`**해설:** ${q.explanation}`));
        assert.ok(block.includes(`> ${q.evidence}`));
    }
    assert.equal(docs.size, 72);
});

test('every event has exactly five different stage questions; canonical stage evidence is required and choices are isolated', () => {
    for (const event of events) {
        const variants = bank.filter(q => q.eventId === event.rumorId);
        assert.deepEqual(variants.map(q => q.minLevel), [1, 2, 3, 4, 5]);
        assert.equal(new Set(variants.map(q => q.question)).size, 5);
        for (const level of [1, 2, 3, 4, 5]) {
            const q = build(event.rumorId, level, event.rumorStages[level - 1]);
            assert.ok(q);
            const expected = variants[level - 1];
            assert.equal(q.question, expected.question);
            q.choices[0] = 'mutated';
            assert.notEqual(build(event.rumorId, level, event.rumorStages[level - 1]).choices[0], 'mutated');
        }
    }
    for (const level of [0, 6, 1.5, NaN]) assert.equal(build(events[0].rumorId, level, 'text'), null);
    assert.equal(build('invented', 1, events[0].rumorStages[0]), null);
    assert.equal(build(events[0].rumorId, 1, events[1].rumorStages[0]), null);
});

test('old generated sessions cannot submit; reopening replaces only session and preserves prior awards', () => {
    for (const previouslyAwarded of [false, true]) {
        let engine = new ItemEngine({ clock: () => 1000, blackSwanEnabled: false });
        const item = { ...structuredClone(events[0]), id: 'owned', isRead: true };
        engine.state.inventory.push(item);
        engine.analysisProgress();
        const growth = engine.state.analysisGrowth;
        growth.proficiency = 2;
        if (previouslyAwarded) growth.awarded[item.rumorId] = { at: 500, amount: 1 };
        growth.quizzes[item.rumorId] = { key: 'old-generated-key', level: 1,
            text: item.rumorStages[0], attempts: 4, completed: previouslyAwarded };
        engine = new ItemEngine({ state: structuredClone(engine.state), clock: () => 1000, blackSwanEnabled: false });
        assert.equal(engine.submitRumorQuiz(item.id, 'old-generated-key', 0).success, false);
        const quiz = engine.beginRumorQuiz(item.id);
        assert.ok(quiz.success);
        assert.match(quiz.key, /^authored-five-v2:/);
        assert.equal(quiz.awarded, previouslyAwarded);
        assert.equal('correctIndex' in quiz, false);
        assert.equal('explanation' in quiz, false);
        assert.equal('evidence' in quiz, false);
        const answer = build(item.rumorId, quiz.level, quiz.text).correctIndex;
        const result = engine.submitRumorQuiz(item.id, quiz.key, answer);
        assert.equal(result.amount, previouslyAwarded ? 0 : 1);
        assert.equal(engine.analysisProgress().current, previouslyAwarded ? 2 : 3);
        assert.equal(engine.submitRumorQuiz(item.id, quiz.key, answer).amount, 0);
    }
});

test('crossing band boundaries refreshes one question and never creates another event reward', () => {
    const engine = new ItemEngine({ clock: () => 1000, blackSwanEnabled: false });
    const item = { ...structuredClone(events[0]), id: 'owned', isRead: true };
    engine.state.inventory.push(item);
    let previous;
    for (const level of [1, 2, 3, 4, 5]) {
        item.interpretationLevel = level;
        const quiz = engine.beginRumorQuiz(item.id);
        if (previous) assert.equal(engine.submitRumorQuiz(item.id, previous.key, 0).success, false);
        const answer = build(item.rumorId, quiz.level, quiz.text).correctIndex;
        assert.equal(engine.submitRumorQuiz(item.id, quiz.key, answer).amount, level === 1 ? 1 : 0);
        previous = quiz;
    }
    assert.equal(engine.analysisProgress().totalCorrect, 1);
});