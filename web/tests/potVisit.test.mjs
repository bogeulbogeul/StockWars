import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPlan } from '../js/app/exhibition/Plan.js';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { expressionForBeat } from '../js/app/exhibition/SomangiPresentation.js';
const chapters = parseChapters(['opening', 'activities-and-ending'].map(name =>
    readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8')).join('\n'));
for (const order of ['packing', 'stock']) test(`${order}: Moa returns before pot purchase and tired player goes home`, () => {
    const plan = buildPlan(chapters, order);
    const seed = plan.findIndex(b => b.text === '가지고 온 씨앗을 심어보고 싶어.');
    const farewell = plan.findIndex(b => b.id === 'moaReturn');
    const visit = plan.findIndex(b => b.chapter === 19 && b.place === 'store');
    const purchase = plan.findIndex(b => b.id === 'pot');
    const yawn = plan.findIndex(b => b.yawn);
    const home = plan.findIndex((b, i) => i > yawn && b.place === 'home');
    assert(seed < farewell && farewell < visit && visit < purchase && purchase < yawn && yawn < home);
    assert(!plan.slice(visit).some(b => b.speaker === '모아'));
    assert.equal(plan[visit].place, 'store');
    assert.equal(plan[yawn].place, 'storeOutside');
    assert.equal(expressionForBeat(plan[yawn]), 'sleepy');
});
