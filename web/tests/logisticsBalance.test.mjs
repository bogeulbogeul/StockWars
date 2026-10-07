import test from 'node:test';
import assert from 'node:assert/strict';
import {deliveryScore,calculateLogisticsGrade,calculateLogisticsSettlement} from '../js/components/logistics/LogisticsRewardEngine.js';
import {LogisticsPhysicsEngine} from '../js/components/logistics/LogisticsPhysicsEngine.js';
test('delivery points reward successful large stacks; two-box loops cannot reach S',()=>{
 assert.deepEqual([1,2,3,4].map(deliveryScore),[1,2,4,6]);
 assert.equal(calculateLogisticsGrade(9,2),'C');assert.equal(calculateLogisticsGrade(10),'B');assert.equal(calculateLogisticsGrade(18),'A');
 assert.equal(calculateLogisticsGrade(100,0),'A');assert.equal(calculateLogisticsGrade(26,1),'A');assert.equal(calculateLogisticsGrade(26,2),'S');
 const result=calculateLogisticsSettlement(18,0,true,0,26,2);assert.equal(result.grade,'S');assert.equal(result.hasRumor,true);assert.equal(result.score,26);
});
test('four-box normal-speed delivery is safe; sprinting is riskier; stopping recovers balance',()=>{
 let crashes=0;const physics=new LogisticsPhysicsEngine({onCrash:()=>crashes++});
 const state={charX:780,velocityX:0,charFacing:-1,keysHeld:new Set(['left']),hasBox:true,carriedCount:4,damageGauge:0,stackCooldown:0};
 for(let i=0;state.charX>280&&i<200;i++){physics.updateMovement(state,.05);physics.updateSensitivity(state,.05);}
 assert.ok(state.charX<=280);assert.equal(crashes,0);assert.ok(state.damageGauge>=70 && state.damageGauge<100);
 const before=state.damageGauge;state.keysHeld.clear();state.velocityX=0;for(let i=0;i<20;i++)physics.updateSensitivity(state,.05);assert.ok(state.damageGauge<before);
 const sprint={...state,damageGauge:0,velocityX:150,keysHeld:new Set(['shift'])};physics.updateSensitivity(sprint,.25);assert.ok(sprint.damageGauge>30 && sprint.damageGauge<100);
 for(let i=0;i<3 && crashes===0;i++)physics.updateSensitivity(sprint,.25);assert.equal(crashes,1);assert.equal(sprint.damageGauge,100);
});
