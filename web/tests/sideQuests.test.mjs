import test from 'node:test';
import assert from 'node:assert/strict';
import { SIDE_QUESTS } from '../js/data/sideQuests.js';
import { SideQuestEngine } from '../js/engine/SideQuestEngine.js';
const sale = profit => ({ side: 'sell', quantity: 1, profit });
const setup = (completed = []) => { let state = {sideQuests:Object.fromEntries(completed.map(id=>[id,{accepted:true,claimed:true}]))}, market = { cash: 1000 }; const quests=new SideQuestEngine(() => state, market);for(const quest of SIDE_QUESTS)quests.accept(quest.id,quest.giver);return {state,market,quests}; };

test('net profit counts actual sale losses, ignores unrelated income and freezes achieved goals', () => {
    const { quests, market } = setup();
    quests.record('trade', sale(700)); quests.record('trade', sale(-500));
    market.cash += 8000;
    quests.record('company', 'A'); quests.record('trade', { side: 'buy', quantity: 1, profit: 9999 });
    assert.equal(quests.list()[0].count, 200);
    quests.record('trade', { side: 'liquidate', quantity: 1, profit: -300 });
    assert.equal(quests.list()[0].count, 0);
    quests.record('trade', sale(1100));
    assert.equal(quests.list()[0].ready, true);
    quests.record('trade', sale(-2000)); assert.equal(quests.list()[0].ready, true);
});
test('profit streak requires three consecutive sales of at least 100G each', () => {
    const { quests } = setup(['challenge_net_profit_v1']);
    quests.record('trade', sale(100)); quests.record('trade', sale(200));
    assert.equal(quests.list()[1].count, 2);
    quests.record('trade', sale(99)); assert.equal(quests.list()[1].count, 0);
    quests.record('trade', sale(100)); quests.record('trade', { side: 'liquidate', quantity: 1, profit: -1 });
    assert.equal(quests.list()[1].count, 0);
    for (let i = 0; i < 3; i++) quests.record('trade', sale(100));
    assert.equal(quests.list()[1].ready, true);
});
test('logistics requires single-round results and flawless rejects broken boxes', () => {
    const { quests } = setup();
    for (let i = 0; i < 3; i++) quests.record('labor', { score: 12, brokenCount: 0 });
    assert.equal(quests.list()[2].count, 12); assert.equal(quests.list()[3].ready, false);
    quests.record('labor', { score: 30, brokenCount: 1 });
    assert.equal(quests.list()[2].ready, true); assert.equal(quests.list()[3].ready, false);
    quests.claim('challenge_logistics_s_v1');quests.accept('challenge_flawless_v1','park');
    quests.record('labor', { score: 30, brokenCount: 1 });assert.equal(quests.list()[3].ready,false);
    quests.record('labor', { score: 18, brokenCount: 0 }); assert.equal(quests.list()[3].ready, true);
});
test('old easy quest records do not complete challenges and rewards persist once', () => {
    let state = { sideQuests: { logistics_regular: { claimed: true, count: 2 } } }, market = { cash: 1000 };
    let quests = new SideQuestEngine(() => state, market);
    assert.ok(quests.list().every(q => !q.ready));
    assert.equal(quests.claim('challenge_logistics_s_v1').success, false);
    quests.accept('challenge_logistics_s_v1','park');
    quests.record('labor', { score: 30, brokenCount: 1 });
    state = JSON.parse(JSON.stringify(state)); quests = new SideQuestEngine(() => state, market);
    assert.equal(quests.claim('challenge_logistics_s_v1').success, true);
    assert.equal(market.cash, 1300); assert.equal(state.exp, 50);
    state = JSON.parse(JSON.stringify(state)); quests = new SideQuestEngine(() => state, market);
    assert.equal(quests.claim('challenge_logistics_s_v1').success, false);
    state = {}; assert.equal(quests.list()[2].count, 0);
});

test('Agent K challenge accepts a finished victory only, excluding draws, losses, forfeits and other opponents', () => {
    const {quests} = setup(), id='challenge_agent_k_v1';
    for(const result of [
        {opponent:'AI',completed:true,playerAssets:12000,opponentAssets:10000},
        {opponent:'에이전트 K',completed:false,playerAssets:12000,opponentAssets:10000},
        {opponent:'에이전트 K',completed:true,playerAssets:10000,opponentAssets:10000},
        {opponent:'에이전트 K',completed:true,playerAssets:9000,opponentAssets:10000},
        {opponent:'에이전트 K',completed:true,playerAssets:NaN,opponentAssets:10000}
    ]){quests.record('arena',result);assert.equal(quests.list().find(q=>q.id===id).ready,false);}
    quests.record('arena',{opponent:'에이전트 K',completed:true,playerAssets:11000,opponentAssets:10000});
    assert.equal(quests.list().find(q=>q.id===id).ready,true);
});
test('Agent K victory and its reward survive reload and cannot pay twice', () => {
    let state={},market={cash:1000},quests=new SideQuestEngine(()=>state,market);
    quests.accept('challenge_agent_k_v1','agent_k');
    quests.record('arena',{opponent:'에이전트 K',completed:true,playerAssets:11000,opponentAssets:10000});
    state=JSON.parse(JSON.stringify(state));quests=new SideQuestEngine(()=>state,market);
    assert.equal(quests.claim('challenge_agent_k_v1').success,true);
    assert.equal(market.cash,1500);assert.equal(state.exp,80);
    state=JSON.parse(JSON.stringify(state));quests=new SideQuestEngine(()=>state,market);
    assert.equal(quests.claim('challenge_agent_k_v1').success,false);assert.equal(market.cash,1500);
});

test('quests remain hidden and do not progress or pay before explicit acceptance', () => {
    const state={}, quests=new SideQuestEngine(()=>state,{cash:0});
    assert.deepEqual(quests.active(),[]);
    quests.record('trade',sale(2000));quests.record('labor',{score:40,brokenCount:0});
    quests.record('arena',{opponent:'에이전트 K',completed:true,playerAssets:11000,opponentAssets:10000});
    assert.deepEqual(quests.active(),[]);assert.ok(quests.list().every(q=>q.count===0&&!q.ready));
    assert.equal(quests.claim('challenge_net_profit_v1').success,false);
    assert.equal(quests.accept('challenge_net_profit_v1','park').success,false);
    assert.equal(quests.accept('challenge_net_profit_v1','anna').success,true);
    assert.equal(quests.active().length,1);assert.equal(quests.active()[0].count,0);
    quests.record('trade',sale(400));assert.equal(quests.active()[0].count,400);
    assert.equal(quests.accept('challenge_net_profit_v1','anna').success,false);
    assert.equal(quests.active()[0].count,400);
});
test('legacy automatic records are not accepted, fresh acceptance resets them, and paid rewards cannot be duplicated', () => {
    const state={sideQuests:{challenge_net_profit_v1:{count:1200,completed:true},challenge_logistics_s_v1:{count:30,claimed:true}}};
    const quests=new SideQuestEngine(()=>state,{cash:0});
    assert.deepEqual(quests.active(),[]);assert.equal(quests.claim('challenge_net_profit_v1').success,false);
    assert.equal(quests.accept('challenge_net_profit_v1','anna').success,true);
    assert.equal(quests.active()[0].count,0);assert.equal(quests.active()[0].ready,false);
    assert.equal(quests.accept('challenge_logistics_s_v1','park').success,false);
});

test('each NPC offers one quest in order and unlocks the next only after reward collection',()=>{
 const {quests}=setup();
 assert.equal(quests.offers('park').length,0);
 assert.equal(quests.accept('challenge_flawless_v1','park').success,false);
 quests.record('labor',{score:30,brokenCount:0});
 assert.equal(quests.offers('park').length,0);
 quests.claim('challenge_logistics_s_v1');
 assert.deepEqual(quests.offers('park').map(q=>q.id),['challenge_flawless_v1']);
 assert.equal(quests.accept('challenge_flawless_v1','park').success,true);
 assert.equal(quests.active().filter(q=>q.giver==='park'&&!q.claimed).length,1);
});
test('legacy simultaneous contracts wait in sequence without losing saved progress',()=>{
 const state={sideQuests:{challenge_logistics_s_v1:{accepted:true,count:12},challenge_flawless_v1:{accepted:true,count:10}}};
 const q=new SideQuestEngine(()=>state,{cash:0});
 assert.equal(q.active().length,1);assert.equal(state.sideQuests.challenge_flawless_v1.count,10);
 q.record('labor',{score:30,brokenCount:1});q.claim('challenge_logistics_s_v1');
 assert.equal(q.accept('challenge_flawless_v1','park').success,true);
 assert.equal(q.active().find(x=>x.id==='challenge_flawless_v1').count,10);
});
