import { VIVIAN_SHOP_CATALOG } from '../js/data/vivianStoreData.js';
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
    engine.state.baseStats.analysis = 5; engine.state.analysisGrowth.level = 5; engine.state.decryptions = 50;
    return { engine, market, advance: ms => { now += ms; engine.tick(); }, set: t => { now = Date.parse(t); engine.tick(); } };
}
// Retired goods are seeded as pre-existing ownership, never repurchased.
const purchase = (e,id,n=1) => {
    if (id === 'item_energy_drink') assert.equal(e.purchase(id,n,false,{vending:true}).success,true,id);
    else if (VIVIAN_SHOP_CATALOG.some(item => item.id === id)) assert.equal(e.purchase(id,n).success,true,id);
    else assert.equal(e.add(id,n),true,id);
};
const use = (e,id) => assert.equal(e.use(id).success,true,id);


test('failed instant uses and full bags never charge gold or consume an item', () => {
    const { engine:e,market:m }=fixture(); const cash=m.cash;
    assert.equal(e.purchase('item_caffeine_shot',1,true).success,false);
    assert.equal(e.purchase('item_crypto_decoder',1,true).success,false);
    assert.equal(m.cash,cash); assert.equal(e.state.inventory.length,0);
    e.state.inventory=Array.from({length:30},(_,i)=>({id:`other${i}`,quantity:1}));
    assert.equal(e.purchase('item_focus_pill').success,false); assert.equal(m.cash,cash);
});

test('drinks heal one heart and caffeine enforces daily use across reloads', () => {
    const f=fixture(),e=f.engine;
    purchase(e,'item_energy_drink',2); e.state.stamina=0; use(e,'item_energy_drink'); assert.equal(e.state.stamina,1);
    purchase(e,'item_caffeine_shot'); use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,2);
    e.add('item_caffeine_shot'); assert.equal(e.use('item_caffeine_shot').success,false);
    const restored=new ItemEngine({market:f.market,clock:e.clock,state:JSON.parse(JSON.stringify(e.state))});
    assert.equal(restored.use('item_caffeine_shot').success,false);
    assert.equal(e.purchase('item_energy_drink',1,false,{vending:true}).success,false);
    f.advance(DAY); assert.equal(e.purchase('item_energy_drink',1,false,{vending:true}).success,true);
    use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,3);
});

test('analysis buff remains temporary; retired ability buffs never affect common rules', () => {
    const {engine:e,advance}=fixture();
    e.analysisProgress(); e.state.analysisGrowth.level=3;
    e.state.baseStats.management=5;
    e.state.buffs.management = e.now() + ITEM_BALANCE.buffMs;
    e.state.buffs.recovery = e.now() + ITEM_BALANCE.buffMs;
    purchase(e,'item_focus_pill',2); use(e,'item_focus_pill');
    assert.equal(e.use('item_focus_pill').success,false);
    assert.deepEqual(e.stats(),{analysis:5});
    assert.equal(e.orderLimit(),100); assert.equal(e.portfolioSlots(),Infinity);
    assert.equal(e.maxStamina(),3); assert.equal(e.laborCost(),1);
    advance(ITEM_BALANCE.buffMs); assert.deepEqual(e.stats(),{analysis:3});
});

test('retired ability items preserve ownership on rejected use; analysis item still reports its effect', () => {
    const {engine:e}=fixture();
    for(const id of ['item_stabilizer','item_vitamin_complex']) {
        e.add(id,2);
        const before=structuredClone(e.state.inventory);
        assert.equal(e.use(id).success,false);
        assert.deepEqual(e.state.inventory,before);
    }
    e.add('item_focus_pill');
    const result=e.use('item_focus_pill');
    assert.equal(result.success,true);
    assert.deepEqual(result.statBoost,{stat:'analysis',name:'분석력',before:5,after:5,amount:0,durationMinutes:120});
});

test('common hearts stay at three across legacy stats, reload, recovery and rest', () => {
    const {engine:e,market,advance}=fixture();
    for(const value of [0,1,2,4,5,100]) {
        e.state.baseStats.recovery=value;
        assert.equal(e.maxStamina(),3);
        assert.equal(e.recoveryAmount(),1); assert.equal(e.laborCost(),1);
    }
    e.state.stamina=1;
    e.add('item_energy_drink',3); e.add('item_caffeine_shot');
    use(e,'item_energy_drink'); assert.equal(e.state.stamina,2);
    use(e,'item_caffeine_shot'); assert.equal(e.state.stamina,3);
    const restored=new ItemEngine({market,clock:e.clock,state:structuredClone(e.state)});
    assert.equal(restored.state.stamina,3);
    e.state.stamina=0; advance(DAY); assert.equal(e.state.stamina,0);
    assert.equal(e.restOnBench().success,true); assert.equal(e.state.stamina,3);
    assert.equal(e.restOnBench().success,false);
    e.advanceDay(); assert.equal(e.state.stamina,3);
    const legacy=structuredClone(e.state); legacy.stamina=2.2;
    assert.equal(new ItemEngine({market,clock:e.clock,state:legacy}).state.stamina,3);
});

test('seven daily mail deliveries survive offline catch-up; claims are idempotent', () => {
    const {engine:e,advance}=fixture(); purchase(e,'item_weekly_drink_ration'); use(e,'item_weekly_drink_ration');
    advance(8*DAY); assert.equal(e.state.mail.length,7); e.tick(); assert.equal(e.state.mail.length,7);
    const id=e.state.mail[0].id; assert.equal(e.claimMail(id).success,true); assert.equal(e.claimMail(id).success,false);
    assert.equal(e.state.inventory.find(i=>i.id==='item_energy_drink').quantity,1);
});

test('previously saved legacy reports retain reveal and scheduled event behavior', () => {
    const {engine:e,market:m,advance}=fixture();
    const report={id:'legacy-report',stockId:'CLOUDBERRY',name:'기존 보고서',parts:Array(6).fill('보존된 단서'),revealed:3,at:e.now()+DAY,resolved:false};
    e.state.reports.push(report);
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
    assert.equal(m.portfolio.size,0); assert.equal(m.cash,Math.round(before)-13); assert.equal(e.state.escape,false);
    assert.equal(e.chartNoise(),.3); use(e,'item_gas_mask'); assert.equal(e.chartNoise(),1);
    advance(60000); assert.equal(e.chartNoise(),0); assert.equal(e.state.survivals,2);
});

test('demo disables overdue and restored active Black Swan events without market effects', () => {
    for (const active of [false, true]) {
        const { engine: original, market } = fixture();
        market.buyStock('CLOUDBERRY', 10);
        const state = JSON.parse(JSON.stringify(original.state));
        state.swanActive = active;
        state.swanAt = original.now() - DAY;
        state.swanEnd = original.now() - 1;
        state.alarm = true;
        state.escape = true;
        const prices = [...market.stocks.values()].map(stock => stock.price);
        const portfolio = JSON.stringify([...market.portfolio]);
        const cash = market.cash;
        const engine = new ItemEngine({ market, clock: original.clock, state, blackSwanEnabled: false });
        assert.equal(engine.state.swanActive, false);
        engine.tick();
        for (let day = 0; day < 10; day++) engine.advanceDay();
        assert.deepEqual([...market.stocks.values()].map(stock => stock.price), prices);
        assert.equal(JSON.stringify([...market.portfolio]), portfolio);
        assert.equal(market.cash, cash);
        assert.equal(engine.chartNoise(), 0);
        assert.equal(engine.state.survivals, original.state.survivals);
        assert.equal(engine.state.escape, true);
        assert.deepEqual(engine.state.notices, []);
    }
});

test('lottery sales boundaries, distinct numbers, manual validation, draw and one-time prize claim', () => {
    const {engine:e,market:m,set}=fixture('2026-10-03T18:59:00+09:00');
    purchase(e,'item_lotto_ticket'); const ticket=e.state.tickets[0]; assert.equal(new Set(ticket.numbers).size,6);
    assert.equal(e.changeTicket(ticket.id,[1,1,2,3,4,5]).success,false);
    assert.equal(e.changeTicket(ticket.id,[1,2,3,4,5,6]).success,true);
    set('2026-10-03T19:00:00+09:00'); assert.equal(e.purchase('item_lotto_ticket').success,false);
    assert.equal(e.changeTicket(ticket.id,[2,3,4,5,6,7]).success,false);
    set('2026-10-03T21:00:00+09:00'); assert.equal(e.state.draws.length,1); assert.equal(ticket.prize,187);
    const cash=m.cash; assert.equal(e.claimPrize(ticket.id).success,true); assert.equal(m.cash,cash+187);
    assert.equal(e.claimPrize(ticket.id).success,false); e.tick(); assert.equal(e.state.draws.length,1);
    assert.equal(e.state.inventory.some(i=>i.id==='item_lotto_ticket'),false);
    assert.equal(lottoClosed(Date.parse('2026-10-03T21:04:59+09:00')),true);
    set('2026-10-03T21:05:00+09:00'); purchase(e,'item_lotto_ticket'); assert.equal(e.state.tickets[1].round,nextDraw(e.now()));
});

test('lottery no winner rolls entire pool forward and restored draws are never duplicated', () => {
    const {engine:e,market:m,set}=fixture(); purchase(e,'item_lotto_ticket'); e.changeTicket(e.state.tickets[0].id,[40,41,42,43,44,45]);
    set('2026-10-03T21:01:00+09:00'); assert.equal(e.state.rollover,250);
    const restored=new ItemEngine({market:m,clock:e.clock,state:JSON.parse(JSON.stringify(e.state)),random:()=>0}); restored.tick();
    assert.equal(restored.state.draws.length,1); assert.equal(restored.state.rollover,250);
});

test('realized sale profit, not unrealized gains or labor wages, unlocks profit milestones', () => {
    const {engine:e,market:m}=fixture(); e.state.profit=0;
    m.buyStock('CLOUDBERRY',10); m.stocks.get('CLOUDBERRY').price+=1000;
    assert.equal(e.state.profit,0); m.sellStock('CLOUDBERRY',10); assert.equal(e.state.profit,9959);
    e.finishLabor(800); assert.equal(e.state.profit,9959);
});

test('energy drinks can be bought and consumed at full stamina without exceeding capacity', () => {
    const { engine, market } = fixture();
    const cash = market.cash, stamina = engine.maxStamina();
    engine.state.stamina = stamina;
    const result = engine.purchase('item_energy_drink', 1, true, {vending:true});
    assert.equal(result.success, true);
    assert.ok(market.cash < cash);
    assert.equal(engine.state.stamina, stamina);
    assert.equal(engine.state.inventory.some(item => item.id === 'item_energy_drink' && item.quantity > 0), false);
    engine.add('item_energy_drink', 2);
    assert.equal(engine.use('item_energy_drink').success, true);
    assert.equal(engine.state.stamina, stamina);
    assert.equal(engine.state.inventory.find(item => item.id === 'item_energy_drink').quantity, 1);
    engine.add('item_caffeine_shot');
    assert.equal(engine.use('item_caffeine_shot').success, false);
    assert.equal(engine.state.inventory.find(item => item.id === 'item_caffeine_shot').quantity, 1);
});

test('bag capacity counts every unit across types, rejects overflow without charging, and preserves legacy holdings', () => {
    const { engine:e, market:m }=fixture();
    assert.equal(e.add('item_energy_drink',29),true);
    assert.equal(e.add('item_crypto_decoder',1),true);
    const cash=m.cash, before=structuredClone(e.state.inventory);
    assert.equal(e.canAdd('item_energy_drink',1),false);
    assert.equal(e.add('item_premium_rumor'),false);
    assert.equal(e.purchase('item_energy_drink',1,false,{vending:true}).success,false);
    assert.equal(m.cash,cash);assert.deepEqual(e.state.inventory,before);
    assert.equal(e.canAdd('x',0),false);assert.equal(e.canAdd('x',-1),false);
    assert.equal(e.canAdd('x',1.5),false);
    e.state.inventory[0].quantity=40;
    const restored=new ItemEngine({market:m,state:structuredClone(e.state)});
    assert.equal(restored.state.inventory.find(i=>i.id==='item_energy_drink').quantity,40);
    assert.equal(restored.canAdd('x'),false);
});
