import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine, DAY, ITEM_BALANCE, lottoClosed, nextDraw } from '../js/engine/ItemEngine.js';
import { MarketEngine, marketEngine } from '../js/engine/marketEngine.js';
marketEngine.stopEngine();

function fixture(date = '2026-09-28T12:00:00+09:00') {
    let now = Date.parse(date);
    const market = new MarketEngine(); market.stopEngine(); market.cash = 1000000;
    const engine = new ItemEngine({ market, clock: () => now, random: () => 0 });
    market.itemEngine = engine;
    engine.state.profit = 30000; engine.state.survivals = 1; engine.state.affinity = 200;
    engine.state.baseStats.analysis = 5; engine.state.decryptions = 50;
    return { engine, market, advance: ms => { now += ms; engine.tick(); }, set: t => { now = Date.parse(t); engine.tick(); } };
}
const purchase = (e,id,n=1) => assert.equal(e.purchase(id,n).success,true,id);
const use = (e,id) => assert.equal(e.use(id).success,true,id);

test('failed instant uses and full bags never charge gold or consume an item', () => {
    const { engine:e,market:m }=fixture(); const cash=m.cash;
    assert.equal(e.purchase('item_energy_drink',1,true).success,false);
    assert.equal(e.purchase('item_crypto_decoder',1,true).success,false);
    assert.equal(m.cash,cash); assert.equal(e.state.inventory.length,0);
    e.state.inventory=Array.from({length:24},(_,i)=>({id:`other${i}`,quantity:1}));
    assert.equal(e.purchase('item_focus_pill').success,false); assert.equal(m.cash,cash);
});

test('drinks heal one heart and caffeine enforces daily use across reloads', () => {
    const f=fixture(),e=f.engine;
    purchase(e,'item_energy_drink',2); e.state.stamina=0; use(e,'item_energy_drink'); assert.equal(e.state.stamina,1);
    purchase(e,'item_caffeine_shot'); use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,2);
    e.add('item_caffeine_shot'); assert.equal(e.use('item_caffeine_shot').success,false);
    const restored=new ItemEngine({market:f.market,clock:e.clock,state:JSON.parse(JSON.stringify(e.state))});
    assert.equal(restored.use('item_caffeine_shot').success,false);
    assert.equal(e.purchase('item_energy_drink').success,false);
    f.advance(DAY); assert.equal(e.purchase('item_energy_drink').success,true);
    use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,3);
});

test('all three buffs affect stats, trading or labor and expire after 120 minutes', () => {
    const {engine:e,market:m,advance}=fixture();
    for(const id of ['item_focus_pill','item_stabilizer','item_vitamin_complex']) { purchase(e,id,2); use(e,id); assert.equal(e.use(id).success,false); }
    assert.equal(e.stats().analysis,7); assert.equal(e.stats().management,3); assert.equal(e.stats().recovery,3);
    assert.equal(e.orderLimit(),110); assert.equal(e.laborCost(),1);
    assert.equal(m.buyStock('CLOUDBERRY',110).success,true);
    assert.equal(m.buyStock('CLOUDBERRY',111).success,false);
    e.finishLabor(100); assert.equal(e.state.stamina,2);
    advance(ITEM_BALANCE.buffMs); assert.equal(e.stats().analysis,5); assert.equal(e.laborCost(),1);
    assert.equal(m.buyStock('CLOUDBERRY',110).success,false);
});

test('both passes expire and quick labor charges stamina, not fees', () => {
    for (const [id,days] of [['item_logistics_quickpass_1d',1],['item_logistics_quickpass_7d',7]]) {
        const {engine:e,market:m,advance}=fixture(); purchase(e,id); use(e,id);
        const cash=m.cash; assert.equal(e.quickJob().success,true); assert.equal(m.cash,cash+ITEM_BALANCE.quickGold);
        assert.equal(e.state.stamina,2); e.state.stamina=0; assert.equal(e.quickJob().success,false);
        advance(days*DAY); e.state.stamina=3; assert.equal(e.quickJob().success,false);
    }
});

test('recovery grants whole hearts, preserves current health on buffs and clamps expired capacity', () => {
    const {engine:e,market,advance}=fixture();
    for (const [level,max] of [[0,3],[1,3],[2,4],[3,4],[4,5],[5,5],[100,5]]) {
        e.state.baseStats.recovery=level;
        assert.equal(e.maxStamina(),max);
        assert.equal(e.recoveryAmount(),1); assert.equal(e.laborCost(),1);
    }
    e.state.baseStats.recovery=2; e.state.stamina=3;
    e.add('item_vitamin_complex',2); use(e,'item_vitamin_complex');
    assert.equal(e.maxStamina(),5); assert.equal(e.state.stamina,3);
    e.add('item_energy_drink',3); e.add('item_caffeine_shot');
    use(e,'item_energy_drink'); assert.equal(e.state.stamina,4);
    use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,5);
    assert.equal(e.use('item_energy_drink').success,false);
    assert.equal(e.state.inventory.find(i=>i.id==='item_energy_drink').quantity,2);
    const restored = new ItemEngine({market,clock:e.clock,state:JSON.parse(JSON.stringify(e.state))});
    assert.equal(restored.maxStamina(),5); assert.equal(restored.state.stamina,5);
    advance(ITEM_BALANCE.buffMs); restored.tick();
    assert.equal(e.maxStamina(),4); assert.equal(e.state.stamina,4);
    assert.equal(restored.state.stamina,4);
    use(e,'item_vitamin_complex'); e.state.stamina=2;
    advance(ITEM_BALANCE.buffMs); assert.equal(e.state.stamina,2);
    e.state.passUntil=e.now()+DAY; e.state.stamina=1;
    assert.equal(e.quickJob().success,true); assert.equal(e.state.stamina,0);
    assert.equal(e.quickJob().success,false);
    assert.equal(e.restOnBench().success,true); assert.equal(e.state.stamina,4);
    assert.equal(e.restOnBench().success,false);
    e.state.baseStats.recovery=4; e.advanceDay(); assert.equal(e.state.stamina,5);
    const legacy=JSON.parse(JSON.stringify(e.state)); legacy.stamina=2.2;
    assert.equal(new ItemEngine({market,clock:e.clock,state:legacy}).state.stamina,3);
});

test('seven daily mail deliveries survive offline catch-up; claims are idempotent', () => {
    const {engine:e,advance}=fixture(); purchase(e,'item_weekly_drink_ration'); use(e,'item_weekly_drink_ration');
    advance(8*DAY); assert.equal(e.state.mail.length,7); e.tick(); assert.equal(e.state.mail.length,7);
    const id=e.state.mail[0].id; assert.equal(e.claimMail(id).success,true); assert.equal(e.claimMail(id).success,false);
    assert.equal(e.state.inventory.find(i=>i.id==='item_energy_drink').quantity,1);
});

test('premium report reveals half, decoder reveals one, darknet key reveals rest; event affects market', () => {
    const {engine:e,market:m,advance}=fixture();
    purchase(e,'item_premium_rumor'); use(e,'item_premium_rumor'); const report=e.state.reports[0];
    assert.equal(report.revealed,3); purchase(e,'item_crypto_decoder'); use(e,'item_crypto_decoder'); assert.equal(report.revealed,4);
    purchase(e,'item_darknet_key'); use(e,'item_darknet_key'); assert.equal(report.revealed,6);
    purchase(e,'item_crypto_decoder'); assert.equal(e.use('item_crypto_decoder').success,false);
    const price=m.stocks.get(report.stockId).price; advance(DAY); assert.equal(m.stocks.get(report.stockId).price,Math.round(price*1.08));
    assert.equal(report.resolved,true);
});

test('alarm and mask toggle without consumption; capsule exits before shock; survival unlocks count', () => {
    const {engine:e,market:m,advance}=fixture();
    for(const id of ['item_black_swan_alarm','item_gas_mask','item_escape_capsule']) {purchase(e,id);use(e,id);}
    assert.equal(e.state.alarm,true); assert.equal(e.state.inventory.find(i=>i.id==='item_gas_mask').quantity,1);
    m.buyStock('CLOUDBERRY',10); const before=m.cash+m.getPortfolioValue(); advance(2*DAY);
    assert.equal(m.portfolio.size,0); assert.equal(m.cash,Math.round(before)); assert.equal(e.state.escape,false);
    assert.equal(e.chartNoise(),.3); use(e,'item_gas_mask'); assert.equal(e.chartNoise(),1);
    advance(60000); assert.equal(e.chartNoise(),0); assert.equal(e.state.survivals,2);
});

test('lottery sales boundaries, distinct numbers, manual validation, draw and one-time prize claim', () => {
    const {engine:e,market:m,set}=fixture('2026-10-03T18:59:00+09:00');
    purchase(e,'item_lotto_ticket'); const ticket=e.state.tickets[0]; assert.equal(new Set(ticket.numbers).size,6);
    assert.equal(e.changeTicket(ticket.id,[1,1,2,3,4,5]).success,false);
    assert.equal(e.changeTicket(ticket.id,[1,2,3,4,5,6]).success,true);
    set('2026-10-03T19:00:00+09:00'); assert.equal(e.purchase('item_lotto_ticket').success,false);
    assert.equal(e.changeTicket(ticket.id,[2,3,4,5,6,7]).success,false);
    set('2026-10-03T21:00:00+09:00'); assert.equal(e.state.draws.length,1); assert.equal(ticket.prize,375);
    const cash=m.cash; assert.equal(e.claimPrize(ticket.id).success,true); assert.equal(m.cash,cash+375);
    assert.equal(e.claimPrize(ticket.id).success,false); e.tick(); assert.equal(e.state.draws.length,1);
    assert.equal(e.state.inventory.some(i=>i.id==='item_lotto_ticket'),false);
    assert.equal(lottoClosed(Date.parse('2026-10-03T21:04:59+09:00')),true);
    set('2026-10-03T21:05:00+09:00'); purchase(e,'item_lotto_ticket'); assert.equal(e.state.tickets[1].round,nextDraw(e.now()));
});

test('lottery no winner rolls entire pool forward and restored draws are never duplicated', () => {
    const {engine:e,market:m,set}=fixture(); purchase(e,'item_lotto_ticket'); e.changeTicket(e.state.tickets[0].id,[40,41,42,43,44,45]);
    set('2026-10-03T21:01:00+09:00'); assert.equal(e.state.rollover,500);
    const restored=new ItemEngine({market:m,clock:e.clock,state:JSON.parse(JSON.stringify(e.state)),random:()=>0}); restored.tick();
    assert.equal(restored.state.draws.length,1); assert.equal(restored.state.rollover,500);
});

test('realized sale profit, not unrealized gains or labor wages, unlocks profit milestones', () => {
    const {engine:e,market:m}=fixture(); e.state.profit=0;
    m.buyStock('CLOUDBERRY',10); m.stocks.get('CLOUDBERRY').price+=1000;
    assert.equal(e.state.profit,0); m.sellStock('CLOUDBERRY',10); assert.equal(e.state.profit,10000);
    e.finishLabor(800); assert.equal(e.state.profit,10000);
});
