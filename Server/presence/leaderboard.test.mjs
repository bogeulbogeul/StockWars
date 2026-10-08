import test from 'node:test';
import assert from 'node:assert/strict';
import { PresenceRegistry } from './registry.mjs';

test('leaderboard contains registered real profiles, preserves zero, keeps private tokens hidden and measures seven days', () => {
    let now = Date.UTC(2026, 9, 8, 12);
    const registry = new PresenceRegistry({ now: () => now });
    const a=registry.session(), b=registry.session();
    registry.update(a.token,'nickname',undefined,{nickname:'실제유저'});
    registry.update(b.token,'nickname',undefined,{nickname:'친구'});
    const submit = (who, worth) => registry.chat(who.token,'leaderboard',undefined,{profile:{netWorth:worth,title:'트레이더'}});
    assert.equal(submit(a,1000).records[0].weeklyReturn,null);
    assert.equal(submit(b,0).records.find(r=>r.name==='친구').netWorth,0);
    assert.equal(submit(a,1000).records.some(r=>'owner' in r||'token' in r),false);
    registry.social.friendships.push([a.token,b.token]);
    now += 7 * 86400000;
    registry.session(a.token);
    const records=submit(a,1200).records;
    assert.ok(Math.abs(records.find(r=>r.isMe).weeklyReturn - 20)<1e-8);
    assert.equal(records.find(r=>r.name==='친구').isFriend,true);
    assert.equal('styleScore' in records[0],false);
    assert.throws(()=>submit(a,NaN),/잘못된/);
    const stranger=registry.session();
    assert.throws(()=>submit(stranger,100),/플레이어 등록/);
    registry.forget(b.token);
    assert.equal(submit(a,1200).records.some(r=>r.name==='친구'),false);
});
