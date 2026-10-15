import test from 'node:test';
import assert from 'node:assert/strict';
import { DurablePlayerStore } from './player-store.mjs';
import { PresenceRegistry } from './registry.mjs';
test('names, friends and gifts restore across server restarts; unchanged polls do not rewrite',async()=>{
    let stored=null,writes=0;const fetchImpl=async(url,opts)=>{if(opts.method==='POST'){stored=JSON.parse(opts.body).payload;writes++;return {ok:true};}return {ok:true,json:async()=>stored?[{payload:stored}]:[]};};
    const store=new DurablePlayerStore({url:'https://example.supabase.co',key:'sb_secret_test',fetchImpl});const r=new PresenceRegistry();await store.restore(r);
    const a=r.session(),b=r.session();r.update(a.token,'nickname',undefined,{nickname:'보존A'});r.update(b.token,'nickname',undefined,{nickname:'보존B'});r.friends(a.token,{operation:'request',targetId:b.playerId});r.friends(b.token,{operation:'accept',targetId:a.playerId});r.friends(a.token,{operation:'gift',giftId:'durable-gift-01',targetName:'보존B',item:{id:'intel',name:'찌라시',category:'intel',quantity:1}});await store.flush(r);const count=writes;await store.flush(r);assert.equal(writes,count);
    const restored=new PresenceRegistry();await new DurablePlayerStore({url:'https://example.supabase.co',key:'sb_secret_test',fetchImpl}).restore(restored);assert.equal(restored.session(a.token).token,a.token);assert.equal(restored.session(b.token).token,b.token);assert.equal(restored.friends(a.token).friends[0].name,'보존B');assert.equal(restored.friends(b.token).gifts[0].item.name,'찌라시');
});
test('unavailable storage refuses restore without overwriting existing records',async()=>{
    const r=new PresenceRegistry();const a=r.session();r.update(a.token,'nickname',undefined,{nickname:'남길기록'});const store=new DurablePlayerStore({url:'https://example.supabase.co',key:'sb_secret_test',fetchImpl:async()=>({ok:false})});await assert.rejects(store.restore(r),/덮어쓰지/);assert.equal([...r.names.values()][0].nickname,'남길기록');
});
test('alpha reset deletes all old records once and preserves new records on restart', async () => {
    let stored = { version: 1, names: [['old', { token: 'old', nickname: '이전유저' }]], social: {
        requests: [{ from: 'old', to: 'other' }], friendships: [['old', 'other']],
        gifts: [{ from: 'old' }], leaderboard: [{ owner: 'old' }], arenaResults: [{ results: [{ owner: 'old' }] }]
    } };
    let writes = 0;
    const fetchImpl = async (url, opts) => {
        if (opts.method === 'POST') { stored = JSON.parse(opts.body).payload; writes++; return { ok: true }; }
        return { ok: true, json: async () => [{ payload: stored }] };
    };
    const options = { url: 'https://example.supabase.co', key: 'sb_secret_test', fetchImpl, dataEpoch: 'alpha2-test' };
    const registry = new PresenceRegistry();
    const store = new DurablePlayerStore(options);
    await store.restore(registry);
    assert.deepEqual(stored, { version: 1, dataEpoch: 'alpha2-test', names: [], social: { requests: [], friendships: [] } });
    const a = registry.session(), b = registry.session();
    registry.claimNickname(a.token, '새유저'); registry.claimNickname(b.token, '새유저');
    await store.flush(registry);
    const count = writes;
    const restarted = new PresenceRegistry();
    await new DurablePlayerStore(options).restore(restarted);
    assert.equal(restarted.names.size, 2);
    assert.equal(writes, count);
});

test('failed alpha reset stops startup without claiming durable success', async () => {
    const store = new DurablePlayerStore({ url: 'https://example.supabase.co', key: 'sb_secret_test', dataEpoch: 'alpha2-test',
        fetchImpl: async (url, opts) => opts.method === 'POST' ? { ok: false } : { ok: true, json: async () => [{ payload: { version: 1, names: [], social: { requests: [], friendships: [] } } }] } });
    await assert.rejects(store.restore(new PresenceRegistry()), /저장/);
    assert.equal(store.last, null);
});
