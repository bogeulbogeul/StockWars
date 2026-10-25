import test from 'node:test';
import assert from 'node:assert/strict';
import {receiveProfileDocument,exhibitionProfile,normalProfile} from '../js/components/phone/profile/ProfileData.js';
import {freshState,complete,loadState,persist} from '../js/app/exhibition/State.js';
import {analysisView} from '../js/components/phone/profile/ProfileViews.js';

test('received, unsigned and submitted documents remain distinct and survive saved story reload',()=>{
 const state=freshState(),storage=new Map();const app={state,save(){storage.set('save',JSON.stringify(state));return true;},view:{error(){}}};
 receiveProfileDocument(app,'residence');assert.equal(exhibitionProfile(state).documents[0].signed,false);
 state.nickname='소망이';complete(state,'nickname');assert.equal(exhibitionProfile(state).name,'소망이');
 receiveProfileDocument(app,'bank');assert.equal(exhibitionProfile(state).documents[1].signed,false);
 complete(state,'bank');receiveProfileDocument(app,'loan',5000);
 assert.equal(exhibitionProfile(state).debt,null);assert.equal(exhibitionProfile(state).documents[2].amount,5000);
 complete(state,'loan');assert.equal(exhibitionProfile(state).debt,5000);assert.equal(state.cash,5000);
 assert.equal(complete(state,'loan'),false);assert.equal(state.cash,5000);
 const saved={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)};persist(saved,state);
 assert.equal(exhibitionProfile(loadState(saved)).documents.filter(d=>d.signed).length,3);
});
test('failed receipt save rolls back and legacy signed flags are read without invented receipt dates',()=>{
 const state=freshState(),before=JSON.stringify(state);assert.equal(receiveProfileDocument({state,save:()=>false,view:{error(){}}},'bank'),false);assert.equal(JSON.stringify(state),before);
 state.flags.nickname=true;state.flags.bank=true;state.nickname='기존 주민';const snapshot=JSON.stringify(state);
 const profile=exhibitionProfile(state);assert.equal(profile.documents.length,2);assert.equal(profile.documents[0].receivedAt,null);assert.equal(profile.documents[0].signed,true);assert.equal(JSON.stringify(state),snapshot);
});
test('analysis UI reads live normal proficiency and handles max level and exhibition values honestly',()=>{
 let current=4;const app={userProfile:{nickname:'실제 이름'},itemEngine:{analysisProgress:()=>({level:3,current,required:40,max:false})}};
 assert.equal(normalProfile(app).analysis.current,4);current=5;assert.equal(normalProfile(app).analysis.current,5);
 assert.match(analysisView(normalProfile(app).analysis),/5 \/ 40/);
 assert.match(analysisView({level:5,max:true,current:0,required:0}),/최고 단계/);
 assert.doesNotMatch(analysisView({level:5,max:true,current:0,required:0}),/progressbar/);
 const state=freshState();state.analysis=2;assert.equal(exhibitionProfile(state).analysis.level,2);assert.equal(exhibitionProfile(state).analysis.current,null);
});
