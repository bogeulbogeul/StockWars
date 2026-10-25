import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNT_QUIZ, drawExamQuestionIds, examQuestions } from '../js/app/exhibition/Quiz.js';
import { freshState, complete, persist, loadState } from '../js/app/exhibition/State.js';

test('15 distinct complete questions each have one indexed answer', () => {
    assert.equal(ACCOUNT_QUIZ.length, 15);
    assert.equal(new Set(ACCOUNT_QUIZ.map(q => q.question + q.passage)).size, 15);
    for (const q of ACCOUNT_QUIZ) {
        assert(q.passage && q.question && q.explanation);
        assert.equal(q.choices.length, 4);
        assert.equal(new Set(q.choices).size, 4);
        assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
    }
});

test('random selection has no repeats and can reach every question', () => {
    const reached = new Set();
    for (let step = 0; step < 150; step++) {
        const ids = drawExamQuestionIds(() => step / 150);
        assert.equal(ids.length, 3);
        assert.equal(new Set(ids).size, 3);
        ids.forEach(id => { assert(ACCOUNT_QUIZ[id]); reached.add(id); });
    }
    assert.equal(reached.size, 15);
});

test('selected questions and partial answers survive saving and loading', () => {
    const state = freshState(); state.examQuestionIds = [14, 7, 3];
    state.answers = [ACCOUNT_QUIZ[14].answer];
    const entries = new Map();
    const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
    persist(storage, state);
    const restored = loadState(storage);
    assert.deepEqual(restored.examQuestionIds, state.examQuestionIds);
    assert.deepEqual(restored.answers, state.answers);
    assert.deepEqual(examQuestions(restored), [14, 7, 3].map(id => ACCOUNT_QUIZ[id]));
});

test('all pool questions are graded against their own answers', () => {
    for (let id = 0; id < 15; id++) {
        for (let mask = 0; mask < 8; mask++) {
            const state = freshState();
            state.examQuestionIds = [id, (id + 1) % 15, (id + 2) % 15];
            complete(state, 'bank');
            state.answers = examQuestions(state).map((q, i) => mask & (1 << i) ? q.answer : (q.answer + 1) % 4);
            assert.equal(complete(state, 'certificate'), true);
            assert.equal(state.analysis, mask === 7 ? 2 : 1);
            assert.equal(complete(state, 'certificate'), false);
        }
    }
});

test('legacy exams retain original questions and malformed selections cannot award', () => {
    const state = freshState(); delete state.examQuestionIds;
    complete(state, 'bank'); state.answers = [2, 1, 3];
    assert.equal(complete(state, 'certificate'), true);
    assert.equal(state.analysis, 2);
    for (const ids of [[0, 0, 1], [0, 1], [0, 1, 15], [0, 1, '2']]) {
        const invalid = freshState(); invalid.flags.bank = true;
        invalid.answers = [2, 1, 3]; invalid.examQuestionIds = ids;
        assert.equal(complete(invalid, 'certificate'), false);
    }
});
