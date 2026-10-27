import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan } from '../js/app/exhibition/Plan.js';
import { freshState, complete } from '../js/app/exhibition/State.js';
import { tutorialStage, skipStageRange, applyTutorialSkip } from '../js/app/exhibition/TutorialSkipState.js';

const chapters = parseChapters(['opening', 'activities-and-ending'].map(name =>
    readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8')).join('\n'));

for (const order of ['packing', 'stock']) test(`${order}: stage skips preserve prerequisites without invented trades or quiz answers`, () => {
    const state = freshState(); state.order = order;
    const plan = buildPlan(chapters, order), stages = [];
    for (let limit = 0; limit < 20; limit++) {
        const range = skipStageRange(plan, state.cursor); stages.push(range.id);
        assert(range.end > state.cursor);
        applyTutorialSkip(state, plan, range);
        if (range.end === plan.length) break;
    }
    assert(stages.includes('information') && stages.includes('bank') && stages.includes('stock') && stages.includes('packing'));
    assert.equal(state.nickname, '소망이'); assert(state.flags.phoneReady && state.flags.cookie);
    assert.equal(state.cash, 5000 + 300 + 2000 - 100); assert.equal(state.debt, 5000);
    assert.equal(state.stamina, 3); assert.equal(state.shares.length, 0); assert.equal(state.answers.length, 0);
    assert.equal(state.analysis, 1); assert(complete(state, 'asleep'));
});

test('a repeated skip cannot duplicate loan, wages or stamina changes', () => {
    const state = freshState(), plan = buildPlan(chapters);
    for (const id of ['bank', 'packing']) {
        state.cursor = plan.findIndex(b => tutorialStage(b)?.[0] === id);
        const range = skipStageRange(plan, state.cursor);
        applyTutorialSkip(state, plan, range); const after = structuredClone(state);
        applyTutorialSkip(state, plan, range); assert.deepEqual(state, after);
    }
});
