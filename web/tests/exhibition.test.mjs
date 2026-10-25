import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan, migrateTourDialogue } from '../js/app/exhibition/Plan.js';
import { freshState, complete, persist, loadState, SAVE_KEY, assets } from '../js/app/exhibition/State.js';
import { isExhibitionMode } from '../js/app/exhibition/Mode.js';
import { nearSleepingMoa, nextMoaCall, MOA_ARRIVAL } from '../js/app/exhibition/Arrival.js';

test('Moa ignores distant calls and wakes on the third nearby interaction only', () => {
    assert.equal(nearSleepingMoa({ x: MOA_ARRIVAL.x - 160, y: MOA_ARRIVAL.y }), false);
    assert.equal(nearSleepingMoa({ x: MOA_ARRIVAL.x - 40, y: MOA_ARRIVAL.y }), true);
    let count = nextMoaCall(0, false); assert.equal(count, 0);
    count = nextMoaCall(count, true); assert.equal(count, 1);
    count = nextMoaCall(count, true); assert.equal(count, 2);
    count = nextMoaCall(count, true); assert.equal(count, 3);
    assert.equal(nextMoaCall(count, true), 3);
});

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

test('renamed tour retains every introduction and selected branches do not leak alternatives', () => {
    const places = ['homeOutside', 'storeOutside', 'furniture', 'pub', 'bookstore', 'post', 'stockOutside', 'bankOutside', 'informationOutside'];
    const names = ['앞으로 지낼 집', '봉봉 잡화점', '우디 가구점', '도란 쉼터', '소담 서점', '두리 우체국', '토리 증권사', '차곡 은행', '모아 안내소'];
    for (const order of ['packing', 'stock']) {
        const tour = buildPlan(chapters, order).filter(b => b.chapter === 3);
        for (let i = 0; i < places.length; i++) {
            assert.equal(tour.filter(b => b.place === places[i]).length, places[i] === 'informationOutside' ? 4 : 3, places[i]);
            assert.ok(tour.some(b => b.place === places[i] && b.text.includes(names[i])), names[i]);
        }
        assert.ok(!tour.some(b => /잎새 증권|새벽달 펍|포포리 안내소/.test(b.text)));
    }
    const packing = buildPlan(chapters, 'packing');
    const orderIndex = packing.findIndex(b => b.id === 'order');
    const next = packing.slice(orderIndex + 1, packing.findIndex(b => b.id === 'notice'));
    assert.ok(next.some(b => b.text === '먼저 잡화점 일을 해볼래.'));
    assert.ok(!next.some(b => b.text === '주식 투자가 어떤 건지 배워보고 싶어.'));
});

test('tour starts near the stop, visits each place once and preserves its original dialogue', () => {
    const current = buildPlan(chapters), historical = buildPlan(chapters, 'packing', true);
    const tour = current.filter(b => b.chapter === 3);
    const visits = tour.filter((b, i) => i === 0 || b.place !== tour[i - 1].place).map(b => b.place);
    assert.equal(visits[0], 'furniture');
    assert.equal(visits.at(-1), 'informationOutside');
    assert.deepEqual(visits, ['furniture', 'post', 'homeOutside', 'tree', 'stockOutside', 'pub',
        'storeOutside', 'bookstore', 'bankOutside', 'notice', 'informationOutside']);
    assert.equal(current.find(b => b.id === 'walk').place, visits[0]);
    const original = historical.filter(b => b.chapter === 3 && b.place !== 'retiredClothing');
    assert.deepEqual(tour.map(b => `${b.place}:${b.text}`).sort(), original.map(b => `${b.place}:${b.text}`).sort());
});

test('dialogue does not reveal the player name before signing', () => {
    const plan = buildPlan(chapters);
    const unsigned = plan.slice(0, plan.findIndex(beat => beat.id === 'nickname'));
    assert.ok(unsigned.filter(beat => beat.kind === 'line').every(beat => !/소망|\[닉네임\]/.test(beat.text)));
});

test('updated dialogue keeps registered saves at the same action and restarts unfinished tours once', () => {
    const plan = buildPlan(chapters);
    const signed = { ...freshState(), cursor: plan.findIndex(beat => beat.id === 'phone') - 3 };
    delete signed.tourDialogueVersion;
    migrateTourDialogue(signed, chapters);
    assert.equal(plan[signed.cursor].id, 'phone');
    const touring = { ...freshState(), cursor: plan.findIndex(beat => beat.chapter === 3) + 4 };
    delete touring.tourDialogueVersion;
    migrateTourDialogue(touring, chapters);
    assert.equal(plan[touring.cursor].id, 'walk');
    const once = structuredClone(touring);
    migrateTourDialogue(touring, chapters);
    assert.deepEqual(touring, once);
});
