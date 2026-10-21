import test from 'node:test';
import assert from 'node:assert/strict';
import {CipherLobby} from '../js/components/CipherCanvasLobby.js';
import {marketEngine} from '../js/engine/marketEngine.js';
marketEngine.stopEngine();
function lobby(){
 return {isOpen:false,dialog:{showModal(){}},notice:{hidden:true},restoreNotice(){},player:{reset(){}},ensurePlayer(){},canvas:{focus(){}},animate(){},greetings:0,tours:0,showAgentWelcome(){this.greetings++;},startAgentIntroduction(){this.tours++;}};
}
test('restored K welcomes returning players on each fresh entry',()=>{
 globalThis.localStorage={getItem:()=> '1'};
 const view=lobby();CipherLobby.prototype.open.call(view);assert.equal(view.greetings,1);
 CipherLobby.prototype.open.call(view);assert.equal(view.greetings,1);
 view.isOpen=false;CipherLobby.prototype.open.call(view);assert.equal(view.greetings,2);assert.equal(view.tours,0);
});
test('restored K introduces the lobby on the first visit',()=>{
 globalThis.localStorage={getItem:()=>null};
 const view=lobby();CipherLobby.prototype.open.call(view);assert.equal(view.tours,1);assert.equal(view.greetings,0);
});
test('return greeting is non-blocking and automatically hides after five seconds',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const view={welcomeBubble:{hidden:true},notice:{hidden:true},hideAgentWelcome:CipherLobby.prototype.hideAgentWelcome};
 CipherLobby.prototype.showAgentWelcome.call(view);
 assert.equal(view.welcomeBubble.hidden,false);assert.equal(view.notice.hidden,true);
 t.mock.timers.tick(4999);assert.equal(view.welcomeBubble.hidden,false);
 t.mock.timers.tick(1);assert.equal(view.welcomeBubble.hidden,true);
});
test('re-entry resets the greeting timeout and exit dismisses it',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const view={welcomeBubble:{hidden:true},hideAgentWelcome:CipherLobby.prototype.hideAgentWelcome};
 CipherLobby.prototype.showAgentWelcome.call(view);t.mock.timers.tick(3000);
 CipherLobby.prototype.showAgentWelcome.call(view);t.mock.timers.tick(2000);assert.equal(view.welcomeBubble.hidden,false);
 view.hideAgentWelcome();assert.equal(view.welcomeBubble.hidden,true);
});

test('completed tutorial opens choices even without the old NPC introduction flag',()=>{
 globalThis.localStorage={getItem:key=>key==='stockwars.cipher.guided-tour.v1'?'1':null};
 let choices=0;
 const view={nearAgentK:()=>true,editor:{active:false},tour:{active:false},player:{stop(){}},renderAgentChoices(){choices++;},startAgentIntroduction(){assert.fail('must not restart tutorial');},notice:{hidden:true,querySelector:()=>({focus(){}})}};
 CipherLobby.prototype.talkToAgentK.call(view);assert.equal(choices,1);assert.equal(view.notice.hidden,false);
 view.tour.active=true;CipherLobby.prototype.talkToAgentK.call(view);assert.equal(choices,1);
});
test('starting guidance hides the ordinary dialogue and records the introduction',()=>{
 const saved=new Map();globalThis.localStorage={setItem:(key,value)=>saved.set(key,value)};
 const view={notice:{hidden:false},agentChoiceMode:true,hideAgentWelcome(){},tour:{start(){assert.equal(view.notice.hidden,true);assert.equal(view.agentChoiceMode,false);}}};
 CipherLobby.prototype.startAgentIntroduction.call(view);
 assert.equal(view.agentKIntroduced,true);assert.equal(saved.get('stockwars.cipher.agent-k.introduced'),'1');
});

test('K menu routes questions and starts free practice without tutorial',t=>{
 globalThis.cancelAnimationFrame=()=>{};
 const calls=[];
 const view={renderAgentMenu(text,options){this.options=options;},renderAgentQuestions:CipherLobby.prototype.renderAgentQuestions,renderAgentAnswer:CipherLobby.prototype.renderAgentAnswer,renderAgentChoices:CipherLobby.prototype.renderAgentChoices,startAgentPractice:CipherLobby.prototype.startAgentPractice,advanceNotice:()=>calls.push('dismiss'),player:{stop(){}},competitionRoom:{open:options=>calls.push(options),start:room=>calls.push(room)}};
 view.renderAgentChoices();assert.deepEqual(view.options.map(o=>o[0]),['토리와 연습 대결','궁금한 게 있어요','옵시디언 회원 안내','대화 마치기']);
 view.options[1][1]();assert.equal(view.options[0][0],'거래 수수료');view.options[0][1]();assert.equal(view.options[0][0],'다른 질문 보기');
 view.renderAgentChoices();view.options[0][1]();assert.equal(calls.length,3);assert.deepEqual(calls[1],{skipTutorial:true});assert.equal(calls[2].stake,0);assert.equal(calls[2].minutes,3);assert.equal(calls[2].cash,100000);assert.equal(calls[2].opponent,'토리');assert.equal(calls[2].difficulty,'hard');
});
