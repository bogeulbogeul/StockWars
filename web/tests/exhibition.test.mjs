import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseChapters } from '../js/app/exhibition/Script.js';
import { buildPlan, migrateTourDialogue } from '../js/app/exhibition/Plan.js';
import { freshState, complete, persist, loadState, SAVE_KEY, assets } from '../js/app/exhibition/State.js';
import { examQuestions } from '../js/app/exhibition/Quiz.js';
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

test('completing the packing shift spends one heart exactly once', () => {
    const state = freshState(); assert.equal(state.stamina, 3);
    complete(state, 'packing'); assert.equal(state.stamina, 2);
    assert.equal(complete(state, 'packing'), false); assert.equal(state.stamina, 2);
    const legacy = freshState(); delete legacy.stamina;
    complete(legacy, 'packing'); assert.equal(legacy.stamina, 2);
});

test('returning from work requires talking to Moa before the first bench line', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order);
        const first = plan.find(b => b.chapter === 12 && b.place === 'bench');
        assert.equal(first.plazaTalk, true);
        assert.equal(plan.filter(b => b.chapter === 12 && b.plazaTalk).length, 1);
    }
});

test('phone unlocks immediately on receipt while the bank farewell still sends Moa to the plaza', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order);
        assert.equal(plan[plan.findIndex(b => b.id === 'phone') + 1].id, 'openPhone');
        const farewell = plan.findIndex(b => b.id === 'moaFarewell');
        assert(farewell > plan.findIndex(b => b.id === 'loan'));
        assert.equal(plan[farewell].place, 'bankOutside');
        assert.equal(plan[farewell - 1].speaker, '모아');
        assert(plan.slice(plan.findIndex(b => b.id === 'order'), farewell).some(b => /광장 벤치/.test(b.text || '')));
        assert.equal(plan.filter(b => b.id === 'moaFarewell').length, 1);
        const mapHint = plan.find(b => b.place === 'bankOutside' && b.text?.includes('스마트폰의 지도앱'));
        assert(mapHint.text.includes('스마트폰의 지도앱'));
        assert(!mapHint.text.includes(order === 'stock' ? '잡화점' : '증권사'));
        const state = freshState(); complete(state, 'phone');
        assert(state.flags.phoneReady);
        complete(state, 'phoneReady'); assert(state.flags.phoneReady);
    }
});

test('both story orders move to the training room exactly when the shared stock lesson begins', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order), lessons = plan.filter(beat => beat.trainingLesson);
        assert.equal(lessons.length, 1);
        assert.equal(lessons[0].chapter, 13); assert.equal(lessons[0].speaker, '토리');
        assert(lessons[0].text.startsWith('회사의 작은 지분'));
        assert(plan.indexOf(lessons[0]) > plan.findIndex(beat => beat.id === 'certificate'));
        assert(plan.findIndex(b => b.id === 'stockCounter') < plan.findIndex(b => b.id === 'certificate'));
        const instruction = plan.find(b => b.chapter === 13 && b.text?.includes('컴퓨터를 켜 주세요'));
        assert(instruction && plan.indexOf(instruction) < plan.findIndex(b => b.id === 'trade'));
    }
});

test('both first-day orders offer packing only after the job explanation and before accepting', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order), index = plan.findIndex(beat => beat.packingOffer);
        assert(index > 0);
        assert.equal(plan.filter(beat => beat.packingOffer).length, 1);
        assert.equal(plan[index].speaker, '봉봉');
        assert(plan[index].text.includes('시작해볼까요'));
        assert(plan[index - 1].text.includes('상자에 담는 일'));
        assert(plan[index + 1].text.includes('해볼게'));
        assert(plan.findIndex(beat => beat.id === 'packing') > index);
    }
});

for (const order of ['packing', 'stock']) test(`${order} first reaches sleep only after both activities, pot and diary`, () => {
    const state = freshState(); state.order = order;
    const actions = buildPlan(chapters, order).filter(b => b.kind === 'action');
    const ids = actions.map(b => b.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.at(-1), 'asleep');
    assert.ok(ids.indexOf(order === 'packing' ? 'packing' : 'trade') < ids.indexOf(order === 'packing' ? 'trade' : 'packing'));
    for (const beat of actions) {
        if (beat.id === 'certificate') state.answers = examQuestions(state).map(q => q.answer);
        assert.equal(complete(state, beat.id, beat.id === 'trade' ? { id: 'DEMO', name: '회사', price: 500 } : {}), true, beat.id);
    }
    assert.equal(state.cash, 6700); assert.equal(state.debt, 5000);
    assert.equal(assets(state), 7200); assert.equal(state.analysis, 2);
    assert.equal(state.flags.asleep, true);
    assert.equal(state.trades.length, 1);
});

test('certificate starts analysis at 2 only for all three correct answers', () => {
    for (let mask = 0; mask < 8; mask++) {
        const state = freshState();
        complete(state, 'bank');
        state.answers = examQuestions(state).map((q, i) => mask & (1 << i) ? q.answer : (q.answer + 1) % q.choices.length);
        assert.equal(complete(state, 'certificate'), true);
        assert.equal(state.analysis, mask === 7 ? 2 : 1);
        assert.equal(complete(state, 'certificate'), false);
    }
});

test('cannot award money or sleep prematurely, nor duplicate transactions after save/reload', () => {
    let state = freshState();
    for (const id of ['loan', 'wage', 'grant', 'pot', 'planted', 'diaryWritten', 'asleep']) assert.equal(complete(state, id), false, id);
    complete(state, 'bank'); complete(state, 'loan');
    const entries = new Map([['stockwars.profile', 'existing-player']]);
    const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
    persist(storage, state); state = loadState(storage);
    assert.equal(complete(state, 'loan'), false); assert.equal(state.cash, 5000);
    state.answers = examQuestions(state).map(q => (q.answer + 1) % q.choices.length); complete(state, 'certificate');
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

test('four map introductions replace outdoor stops and selected branches do not leak alternatives', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order), map = plan.filter(b => b.mapIntro);
        assert.equal(map.length, 4); assert(map.every(b => b.place === 'information' && b.speaker === '모아'));
        assert.equal(plan.filter(b => b.chapter === 3).length, 0);
        assert(plan.findIndex(b => b.mapIntro) > plan.findIndex(b => b.id === 'openPhone'));
    }
    const packing = buildPlan(chapters, 'packing');
    const orderIndex = packing.findIndex(b => b.id === 'order');
    const next = packing.slice(orderIndex + 1, packing.findIndex(b => b.id === 'notice'));
    assert.ok(next.some(b => b.text === '먼저 잡화점 일을 해볼래.'));
    assert.ok(!next.some(b => b.text === '주식 투자가 어떤 건지 배워보고 싶어.'));
});

test('go straight from information to bank and visit home only at night', () => {
    for (const order of ['packing', 'stock']) {
        const plan = buildPlan(chapters, order);
        assert.equal(plan.find(b => b.id === 'walk').place, 'informationOutside');
        const home = plan.findIndex(b => b.place === 'home'), bank = plan.findIndex(b => b.place === 'bank');
        assert(bank > plan.findLastIndex(b => b.mapIntro)); assert(home > bank);
        assert.equal(plan.find(b => b.chapter === 6).place, 'information');
        assert(plan.findIndex(b => b.id === 'order') > plan.findIndex(b => b.id === 'loan'));
        assert.equal(plan.find(b => b.id === 'order').place, 'bankOutside');
        assert.equal(plan.filter(b => b.chapter === 9 && b.place === 'home').length, 0);
    }
});

test('dialogue does not reveal the player name before signing', () => {
    const plan = buildPlan(chapters);
    const unsigned = plan.slice(0, plan.findIndex(beat => beat.id === 'nickname'));
    assert.ok(unsigned.filter(beat => beat.kind === 'line').every(beat => !/소망이|\[닉네임\]/.test(beat.text)));
});

test('updated dialogue keeps registered saves at the same action and restarts unfinished tours once', () => {
    const plan = buildPlan(chapters), legacy = buildPlan(chapters, 'packing', false, true);
    const signed = { ...freshState(), cursor: legacy.findIndex(beat => beat.id === 'phone') - 3 };
    delete signed.tourDialogueVersion;
    migrateTourDialogue(signed, chapters);
    assert.equal(plan[signed.cursor].id, 'phone');
    const touring = { ...freshState(), cursor: legacy.findIndex(beat => beat.chapter === 3) + 4 };
    delete touring.tourDialogueVersion;
    migrateTourDialogue(touring, chapters);
    assert.equal(plan[touring.cursor].id, 'walk');
    const once = structuredClone(touring);
    migrateTourDialogue(touring, chapters);
    assert.deepEqual(touring, once);
});

test('restored original dialogue sends Moa ahead while keeping the current short location route', () => {
 const p=buildPlan(chapters),short=buildPlan(chapters,'packing',false,false,true);
 assert(p.filter(b=>b.kind==='line').length>short.filter(b=>b.kind==='line').length);
 assert(p.some(b=>b.text==='왔다! 드디어 왔어요!'));
 assert(p.some(b=>b.chapter===2&&b.text.includes('먼저 들어가서 기다리고')));
 assert(!p.some(b=>b.chapter===3));
 assert.deepEqual(p.filter(b=>b.kind==='action').map(b=>b.id),short.filter(b=>b.kind==='action').map(b=>b.id));
});
test('short-dialogue action cursors migrate to the same restored action without changing rewards', () => {
 for(const order of ['packing','stock']){
  const old=buildPlan(chapters,order,false,false,true,true,true),current=buildPlan(chapters,order);
  for(let i=0;i<old.length;i++)if(old[i].kind==='action'){
   const s={...freshState(),order,cursor:i,tourDialogueVersion:2,cash:6200,debt:5000};migrateTourDialogue(s,chapters);
   assert.equal(current[s.cursor].id,old[i].id);assert.equal(s.cash,6200);assert.equal(s.debt,5000);assert.equal(s.tourDialogueVersion,5);
  }
 }
});

test('home preview saves resume at bank preparation and retain later action positions', () => {
 for(const order of ['packing','stock']) {
  const old=buildPlan(chapters,order,false,false,false,true,true), current=buildPlan(chapters,order);
  for(let i=0;i<old.length;i++) if(old[i].kind==='action'||old[i].chapter===9&&old[i].place==='home') {
   const state={...freshState(),order,cursor:i,tourDialogueVersion:3,cash:6200,debt:5000};
   migrateTourDialogue(state,chapters);
   if(old[i].kind==='action') assert.equal(current[state.cursor].id,old[i].id);
   else {assert.equal(current[state.cursor].chapter,6); assert.equal(current[state.cursor].place,'information');}
   assert.equal(state.cash,6200);assert.equal(state.debt,5000);assert.equal(state.tourDialogueVersion,5);
  }
 }
});

test('loan question is answered and player agrees before the application appears',()=>{
 for(const order of ['packing','stock']){
  const p=buildPlan(chapters,order), question=p.findIndex(b=>b.text==='언제까지 갚아야 해?'),loan=p.findIndex(b=>b.id==='loan');
  const between=p.slice(question+1,loan);
  assert(between.some(b=>b.speaker==='차곡'&&b.text.includes('상환 기한이나 이자를 적용하지 않습니다')));
  assert(between.some(b=>b.text.includes('대출 원금으로 기록')));
  assert(between.some(b=>b.speaker==='소망이'&&b.text.includes('신청할래')));
  assert(between.at(-1).text.includes('대출 신청서를 드릴게요'));
  assert(p[loan+1].text.includes('계좌에 넣어드렸습니다'));
 }
});
test('previous bank flow saves preserve actions, payout and cash under reordered loan dialogue',()=>{
 for(const order of ['packing','stock']){
  const old=buildPlan(chapters,order,false,false,false,false,true), current=buildPlan(chapters,order);
  for(let i=0;i<old.length;i++)if(old[i].kind==='action'){
   const s={...freshState(),order,cursor:i,tourDialogueVersion:4,cash:6200,debt:5000};migrateTourDialogue(s,chapters);
   assert.equal(current[s.cursor].id,old[i].id);assert.equal(s.cash,6200);assert.equal(s.debt,5000);assert.equal(s.tourDialogueVersion,5);
  }
  const i=old.findIndex(b=>b.id==='loan')+1,s={...freshState(),order,cursor:i,tourDialogueVersion:4,flags:{bank:true,loan:true},cash:5000,debt:5000};
  migrateTourDialogue(s,chapters);assert(current[s.cursor].text.includes('계좌에 넣어드렸습니다'));assert.equal(s.cash,5000);assert.equal(s.debt,5000);
 }
});
