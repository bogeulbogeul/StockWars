import test from 'node:test';
import assert from 'node:assert/strict';
import {installOnlineCompetition} from '../js/components/OnlineCompetition.js';
import {marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
class Lobby{render(){}requestJoin(){}}
installOnlineCompetition(Lobby);
function setup(){const lobby=new Lobby(),calls=[];lobby.onlineMatchId='match';lobby.onlineState={room:{id:'match'},phase:'running'};lobby.pendingArenaOrder={side:'buy'};lobby.match={closeDirect(){calls.push('close');}};lobby.arenaRequest=async input=>{calls.push(input);return {};};lobby.updateOnlineMatch=()=>calls.push('update');return {lobby,calls};}
test('spectating forfeits once, retains the match, and blocks subsequent orders',async()=>{
 const {lobby,calls}=setup();await lobby.forfeitOnlineMatch(true);assert.deepEqual(calls,[{action:'leave',id:'match'},'update']);assert.equal(lobby.onlineSpectating,true);assert.equal(lobby.pendingArenaOrder,null);assert.equal(lobby.onlineLeaveSent,true);await lobby.onlineOrder('buy');assert.equal(calls.length,2);
});
test('leaving closes only after server confirms forfeit',async()=>{
 const {lobby,calls}=setup();await lobby.forfeitOnlineMatch(false);assert.deepEqual(calls,[{action:'leave',id:'match'},'close']);
});
test('failed forfeits preserve match and support retry',async()=>{
 const {lobby,calls}=setup();lobby.arenaRequest=async()=>{throw Error('offline');};await assert.rejects(lobby.forfeitOnlineMatch(true),/offline/);assert.equal(lobby.onlineForfeitPending,false);assert.equal(lobby.onlineSpectating,undefined);assert.deepEqual(calls,[]);assert.notEqual(lobby.pendingArenaOrder,null);
});
test('duplicate choices while request is pending do not send duplicate forfeits',async()=>{
 const {lobby,calls}=setup();let resolve;lobby.arenaRequest=()=>new Promise(r=>resolve=r);const first=lobby.forfeitOnlineMatch(true);await lobby.forfeitOnlineMatch(false);resolve({});await first;assert.deepEqual(calls,['update']);
});
