import test from 'node:test';
import assert from 'node:assert/strict';
import {PresenceRegistry} from './registry.mjs';
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
