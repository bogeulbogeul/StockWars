import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan } from '../js/app/exhibition/Plan.js';
import { freshState, complete } from '../js/app/exhibition/State.js';

const chapters = parseChapters(['opening', 'activities-and-ending'].map(name =>
    readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8')).join('\n'));
for (const order of ['packing', 'stock']) test(`${order}: cookie, gifts and seed conversation stay at the plaza in order`, () => {
    const plan = buildPlan(chapters, order);
    const cookie = plan.findIndex(b => b.id === 'cookie');
    const grant = plan.findIndex(b => b.id === 'grant');
    const diary = plan.findIndex(b => b.id === 'diary');
    const opened = plan.findIndex(b => b.chapter === 17 && b.kind === 'line' && b.text.includes('쿠키 이야기부터'));
    const seed = plan.findIndex(b => b.chapter === 18 && b.speaker === '소망이' && b.text.includes('씨앗'));
    assert(cookie >= 0 && opened >= 0 && seed >= 0);
    assert(cookie < grant && grant < diary && diary < opened && opened < seed);
    assert(plan.slice(cookie, seed + 1).every(b => b.place === 'bench'));
    assert(!plan.slice(cookie, seed).some(b => b.text?.includes('안내소에 잠깐')));
});
test('settlement money is granted once after eating', () => {
    const state = freshState();
    assert.equal(complete(state, 'grant'), false);
    state.flags.cookie = true;
    assert.equal(complete(state, 'grant'), true);
    assert.equal(complete(state, 'grant'), false);
    assert.equal(state.cash, 2000);
});
