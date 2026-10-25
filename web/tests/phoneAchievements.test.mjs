import test from 'node:test';
import assert from 'node:assert/strict';
import {storyAchievements,playerAchievements} from '../js/components/phone/achievements/AchievementData.js';

test('first-day achievements read saved milestones without claiming money, titles or quests',()=>{
 const state={cash:500,debt:0,flags:{nickname:true,bank:true,certificate:true}};const before=JSON.stringify(state);
 const list=storyAchievements(state);assert.equal(list.length,8);assert.equal(list.filter(a=>a.earned).length,3);
 assert.equal(JSON.stringify(state),before);state.flags.trade=true;assert.equal(storyAchievements(state).find(a=>a.id==='first-share').earned,true);
});
test('growth achievements use actual player level and unique correct-event history, including partial progress',()=>{
 let level=4,analysis={level:2,totalCorrect:3};const app={itemEngine:{playerLevel:()=>level,analysisProgress:()=>analysis}};
 const before=playerAchievements(app);assert.equal(before.find(a=>a.id==='level5').earned,false);assert.equal(before.find(a=>a.id==='quiz10').current,3);
 level=5;analysis={level:3,totalCorrect:10};const after=playerAchievements(app);assert.equal(after.find(a=>a.id==='level5').earned,true);assert.equal(after.find(a=>a.id==='quiz10').earned,true);assert.equal(after.find(a=>a.id==='level10').current,5);
});
