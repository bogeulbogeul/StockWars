import test from 'node:test';
import assert from 'node:assert/strict';
import {installOnlineCompetition} from '../js/components/OnlineCompetition.js';
import {marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
const element=()=>({children:[],style:{},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];}});
class Lobby {render(){} requestJoin(){}}
installOnlineCompetition(Lobby);
globalThis.document={createElement:element};
globalThis.window={};

test('arena shows online friends, searches exact nickname, and restores the list after clearing',async()=>{
    const calls=[];
    const friends=[{name:'민수',online:true},{name:'민수2',online:true},{name:'지수',online:false}];
    window.stockWarsChat={friends:async action=>{calls.push(action);return {friends};}};
    const list=element(),lobby=new Lobby();lobby.dialog={querySelector:()=>list};
    const names=()=>list.children.filter(row=>row.children.length).map(row=>row.children[0].textContent);
    await lobby.refreshFriends();assert.deepEqual(names(),['민수','민수2']);
    lobby.friendQuery='민수';await lobby.refreshFriends();assert.deepEqual(names(),['민수']);
    await lobby.refreshFriends();assert.deepEqual(names(),['민수']);
    lobby.friendQuery='지수';await lobby.refreshFriends();assert.equal(list.children[0].textContent,'해당 닉네임의 온라인 친구가 없습니다.');
    lobby.friendQuery='';await lobby.refreshFriends();assert.deepEqual(names(),['민수','민수2']);
    friends[0].online=false;friends[1].online=false;await lobby.refreshFriends();assert.equal(list.children[0].textContent,'현재 접속 중인 친구가 없습니다.');
    assert.ok(calls.every(action=>action==='list'),'search must never send a friend request');
});

test('an older friend refresh cannot overwrite newer presence',async()=>{
    const pending=[];window.stockWarsChat={friends:()=>new Promise(resolve=>pending.push(resolve))};
    const list=element(),lobby=new Lobby();lobby.dialog={querySelector:()=>list};
    const old=lobby.refreshFriends(),recent=lobby.refreshFriends();
    pending[1]({friends:[]});await recent;
    pending[0]({friends:[{name:'접속 종료한 친구',online:true}]});await old;
    assert.equal(list.children[0].textContent,'현재 접속 중인 친구가 없습니다.');
});
