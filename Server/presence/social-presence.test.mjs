import test from 'node:test';
import assert from 'node:assert/strict';
import {PresenceRegistry} from './registry.mjs';
test('cipher sofas accept one occupant, allow the other sofa, and release on standing or leaving',()=>{
    const r=new PresenceRegistry(),a=r.session(),b=r.session();for(const s of [a,b])r.update(s.token,'join','town-1');
    const pose={x:998,y:531,facing:'right',location:'cipher',resting:true,seatId:'lounge-left'};
    r.update(a.token,'position',undefined,{...pose,nickname:'좌석하나'});
    const denied=r.update(b.token,'position',undefined,{...pose,nickname:'좌석둘',seatId:'lounge-left-2'});
    assert.equal(denied.seatRejected,'lounge-left-2');assert.equal(r.sessions.get(b.token).pose.resting,false);
    assert.equal(r.snapshot(b.token).players.filter(p=>p.resting&&p.seatId==='lounge-left').length,1);
    assert.equal(r.update(b.token,'position',undefined,{...pose,seatId:'lounge-right'}).seatRejected,undefined);
    r.update(a.token,'position',undefined,{...pose,resting:false});
    assert.equal(r.update(b.token,'position',undefined,pose).seatRejected,undefined);
    r.update(b.token,'leave');
    assert.equal(r.update(a.token,'position',undefined,pose).seatRejected,undefined);
});
test('a disconnected or stale occupant does not keep a sofa locked',()=>{
    let now=1000;const r=new PresenceRegistry({now:()=>now}),a=r.session(),b=r.session();for(const s of [a,b])r.update(s.token,'join','town-1');
    const pose={x:1269,y:562.5,facing:'left',location:'cipher',resting:true,seatId:'lounge-right'};
    r.update(a.token,'position',undefined,pose);now+=5001;
    assert.equal(r.update(b.token,'position',undefined,pose).seatRejected,undefined);
    assert.equal(r.update(a.token,'position',undefined,pose).seatRejected,'lounge-right');
    r.update(b.token,'disconnect');assert.equal(r.update(a.token,'position',undefined,pose).seatRejected,undefined);
});
test('location changes are broadcast immediately and invalid locations cannot replace a pose',()=>{
    const r=new PresenceRegistry(),a=r.session(),b=r.session();for(const s of [a,b])r.update(s.token,'join','town-1');
    const pose={x:700,y:900,facing:'down',nickname:'실내친구',location:'town'};r.update(b.token,'position',undefined,pose);
    assert.equal(r.snapshot(a.token).players[0].location,'town');r.update(b.token,'position',undefined,{...pose,x:1000,y:750,location:'cipher'});
    assert.equal(r.snapshot(a.token).players[0].location,'cipher');assert.equal(r.snapshot(a.token).players[0].x,1000);
    assert.throws(()=>r.update(b.token,'position',undefined,{...pose,location:'unknown'}),/장소/);assert.equal(r.snapshot(a.token).players[0].location,'cipher');
    r.update(b.token,'position',undefined,{...pose,location:'cipher',resting:true,seatId:'sofa-one'});assert.equal(r.snapshot(a.token).players[0].seatId,'sofa-one');
    r.update(b.token,'position',undefined,{...pose,location:'cipher',resting:false,seatId:'sofa-one'});assert.equal(r.snapshot(a.token).players[0].seatId,null);
});
test('chat room summaries notify a recipient even when they poll another room',()=>{
    const r=new PresenceRegistry(),a=r.session(),b=r.session();r.update(a.token,'nickname',undefined,{nickname:'발신자'});r.update(b.token,'nickname',undefined,{nickname:'수신자'});r.friends(a.token,{operation:'request',targetId:b.playerId});r.friends(b.token,{operation:'accept',targetId:a.playerId});
    const {roomId}=r.friends(a.token,{operation:'chat',targetId:b.playerId});r.chat(a.token,'send','닫힌 폰에도 알림',{roomId});
    const receiver=r.chat(b.token,'list').rooms.find(r=>r.id===roomId),sender=r.chat(a.token,'list').rooms.find(r=>r.id===roomId);
    assert.equal(receiver.title,'발신자');assert.equal(receiver.lastMessage.text,'닫힌 폰에도 알림');assert.equal(receiver.incomingIds.length,1);assert.equal(sender.incomingIds.length,0);
});
