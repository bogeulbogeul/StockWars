import test from 'node:test';
import assert from 'node:assert/strict';
import { PresenceRegistry } from './registry.mjs';
import { OnlineArena } from './arena.mjs';
function setup(){let now=1000000;const registry=new PresenceRegistry({now:()=>now});const a=registry.session(),b=registry.session(),c=registry.session();for(const [s,n] of [[a,'방장'],[b,'친구'],[c,'외부인']])registry.update(s.token,'nickname',undefined,{nickname:n});registry.friends(a.token,{operation:'request',targetId:b.playerId});registry.friends(b.token,{operation:'accept',targetId:a.playerId});return {registry,a,b,c,arena:new OnlineArena(registry),advance:ms=>now+=ms};}
const config={name:'같은 시장 대결',minutes:3,cash:100000,stake:0,passwordHash:'a'.repeat(64)};
test('private room invitation, actual membership, readiness and host-only start',()=>{
    const {registry,arena,a,b,c}=setup();const created=arena.handle(a.token,{action:'create',room:config});const id=created.room.id;
    assert.equal(arena.handle(b.token,{action:'list'}).rooms.length,0);
    assert.throws(()=>arena.handle(c.token,{action:'join',id,passwordHash:'b'.repeat(64)}),/비밀번호/);
    assert.throws(()=>arena.handle(a.token,{action:'invite',id,targetName:'외부인'}),/등록된 친구/);
    registry.update(b.token,'disconnect');assert.throws(()=>arena.handle(a.token,{action:'invite',id,targetName:'친구'}),/오프라인/);
    registry.session(b.token);arena.handle(a.token,{action:'invite',id,targetName:'친구'});
    assert.equal(arena.handle(b.token,{action:'list'}).invitations[0].id,id);
    const joined=arena.handle(b.token,{action:'join',id});assert.equal(joined.members.length,2);
    assert.throws(()=>arena.handle(b.token,{action:'start',id}),/방장/);
    assert.throws(()=>arena.handle(a.token,{action:'start',id}),/모두 준비/);
    arena.handle(a.token,{action:'ready',id,ready:true});arena.handle(b.token,{action:'ready',id,ready:true});
    assert.equal(arena.handle(a.token,{action:'start',id}).phase,'running');
});
test('shared server prices, isolated ledgers, idempotent orders, deadline and ranked results',()=>{
    const {arena,a,b,advance}=setup();const state=arena.handle(a.token,{action:'create',room:{...config,passwordHash:null}});const id=state.room.id;
    arena.handle(b.token,{action:'join',id});for(const s of [a,b])arena.handle(s.token,{action:'ready',id,ready:true});arena.handle(a.token,{action:'start',id});
    const stock=state.market.stocks.find(s=>s.price<100000);const order={action:'trade',id,side:'buy',quantity:1,stockId:stock.id,requestId:'order-one-0001'};
    const first=arena.handle(a.token,order);assert.equal(first.market.portfolio[0].qty,1);
    assert.equal(arena.handle(a.token,order).market.portfolio[0].qty,1);
    assert.equal(arena.handle(b.token,{action:'state',id}).market.portfolio.length,0);
    assert.throws(()=>arena.handle(b.token,{...order,side:'sell',requestId:'order-b-0001'}),/保有|보유/);
    advance(12000);const s1=arena.handle(a.token,{action:'state',id}),s2=arena.handle(b.token,{action:'state',id});
    assert.deepEqual(s1.market.stocks,s2.market.stocks);assert.deepEqual(s1.histories,s2.histories);
    advance(180000);const end=arena.handle(a.token,{action:'state',id});assert.equal(end.phase,'finished');assert.equal(end.results.length,2);
    assert.equal(end.results[0].rank,1);assert.throws(()=>arena.handle(a.token,{...order,requestId:'order-after-end'}),/거래 가능한/);
});
test('ended rooms are destroyed while participants can briefly read their results',()=>{
    const {arena,registry,a,b,c,advance}=setup();const id=arena.handle(a.token,{action:'create',room:{...config,passwordHash:null}}).room.id;
    arena.handle(b.token,{action:'join',id});for(const s of [a,b])arena.handle(s.token,{action:'ready',id,ready:true});arena.handle(a.token,{action:'start',id});
    advance(180000);arena.sweep();
    assert.equal(arena.rooms.has(id),false);
    const list=arena.handle(a.token,{action:'list'});assert.equal(list.rooms.length,0);assert.equal(list.ownRooms.length,0);
    const results=arena.handle(a.token,{action:'state',id});assert.equal(results.phase,'finished');assert.equal(results.results.length,2);
    assert.equal(arena.handle(b.token,{action:'state',id}).results.filter(r=>r.isOwn).length,1);
    assert.throws(()=>arena.handle(c.token,{action:'state',id}),/참가 중/);
    assert.throws(()=>arena.handle(a.token,{action:'join',id}),/거래 가능한/);
    arena.sweep();assert.equal(registry.social.arenaResults.length,1);
    arena.handle(a.token,{action:'leave',id});assert.equal(arena.completed.get(id).snapshots.size,1);
    advance(300000);arena.sweep();assert.equal(arena.completed.has(id),false);assert.equal(registry.social.arenaResults.length,1);
});