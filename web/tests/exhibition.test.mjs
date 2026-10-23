import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan } from '../js/app/exhibition/Plan.js';
import { freshState, complete, persist, loadState, SAVE_KEY, assets } from '../js/app/exhibition/State.js';
import { isExhibitionMode } from '../js/app/exhibition/Mode.js';

const chapters = parseChapters(['opening', 'activities-and-ending'].map(name =>
    readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8')).join('\n'));

for (const order of ['packing', 'stock']) test(`${order} first reaches sleep only after both activities, pot and diary`, () => {
    const state = freshState(); state.order = order;
    const actions = buildPlan(chapters, order).filter(b => b.kind === 'action');
    const ids = actions.map(b => b.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.at(-1), 'asleep');
    assert.ok(ids.indexOf(order === 'packing' ? 'packing' : 'trade') < ids.indexOf(order === 'packing' ? 'trade' : 'packing'));
    for (const beat of actions) {
        if (beat.id === 'certificate') state.answers = [2, 1, 3];
        assert.equal(complete(state, beat.id, beat.id === 'trade' ? { id: 'DEMO', name: '회사', price: 500 } : {}), true, beat.id);
    }
    assert.equal(state.cash, 6900); assert.equal(state.debt, 5000);
    assert.equal(assets(state), 7400); assert.equal(state.analysis, 3);
    assert.equal(state.flags.asleep, true);
    assert.equal(state.trades.length, 1);
});

test('cannot award money or sleep prematurely, nor duplicate transactions after save/reload', () => {
    let state = freshState();
    for (const id of ['loan', 'wage', 'grant', 'pot', 'planted', 'diaryWritten', 'asleep']) assert.equal(complete(state, id), false, id);
    complete(state, 'bank'); complete(state, 'loan');
    const entries = new Map([['stockwars.profile', 'existing-player']]);
    const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
    persist(storage, state); state = loadState(storage);
    assert.equal(complete(state, 'loan'), false); assert.equal(state.cash, 5000);
    state.answers = [0, 0, 0]; complete(state, 'certificate');
    assert.equal(state.analysis, 1, 'wrong answers still allow certificate');
    assert.equal(complete(state, 'trade', { price: 6000 }), false);
    assert.equal(complete(state, 'trade', { id: 'A', name: '회사', price: 500 }), true);
    assert.equal(complete(state, 'trade', { price: 500 }), false);
    assert.equal(state.cash, 4500); assert.equal(entries.get('stockwars.profile'), 'existing-player');
    assert.ok(entries.has(SAVE_KEY));
});

test('new demo defaults to first day while explicit legacy and art reviews remain available', () => {
    assert.equal(isExhibitionMode(''), true);
    assert.equal(isExhibitionMode('?demo=first-day'), true);
    assert.equal(isExhibitionMode('?demo=standard'), false);
    assert.equal(isExhibitionMode('?scene=bank'), false);
});

test('shipping script is the original committed text and selected branches do not leak alternatives', () => {
    for (const name of ['opening', 'activities-and-ending']) {
        assert.equal(readFileSync(new URL(`../assets/exhibition/${name}.txt`, import.meta.url), 'utf8'),
            readFileSync(new URL(`../../output/opening-dialogue-v1/${name}.txt`, import.meta.url), 'utf8'));
    }
    const packing = buildPlan(chapters, 'packing');
    const orderIndex = packing.findIndex(b => b.id === 'order');
    const next = packing.slice(orderIndex + 1, packing.findIndex(b => b.id === 'notice'));
    assert.ok(next.some(b => b.text === '먼저 잡화점 일을 해볼래.'));
    assert.ok(!next.some(b => b.text === '주식 투자가 어떤 건지 배워보고 싶어.'));
});
