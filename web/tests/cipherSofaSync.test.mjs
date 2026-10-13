import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineSocialSync} from '../js/app/OnlineSocialSync.js';
test('server seat rejection returns the losing player to standing without cancelling a later seat',async t=>{
    t.mock.method(globalThis,'setTimeout',()=>0);
    const oldWindow=globalThis.window;t.after(()=>{globalThis.window=oldWindow;});
    const seat={id:'lounge-left'},player={x:998,y:531,facing:1};let stood=0,replace=false;
    const lobby={seated:seat,editor:{items:[]},standUp(){stood++;this.seated=null;}};
    const app={cipherLobby:lobby,isLocalSession:false,userProfile:{nickname:'좌석테스트'}};
    const scene={location:'cipher',player};
    const sync={app,currentScene:()=>scene,lastRankingSync:Date.now(),receive(){}};
    globalThis.window={stockWarsPresence:{position:async()=>{if(replace)lobby.seated={id:'lounge-right'};return {snapshot:{players:[],seatRejected:'lounge-left'}};}}};
    await OnlineSocialSync.prototype.poll.call(sync);assert.equal(stood,1);assert.equal(lobby.seated,null);
    lobby.seated=seat;replace=true;await OnlineSocialSync.prototype.poll.call(sync);assert.equal(stood,1);assert.equal(lobby.seated.id,'lounge-right');
});
