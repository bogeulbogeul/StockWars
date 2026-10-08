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
function simulateDelivery({ count, startX = 780, dt = 1 / 60, stabilize = false, sprint = false }) {
 let crashed = false, resting = false, stops = 0, elapsed = 0;
 const physics = new LogisticsPhysicsEngine({ onCrash: () => { crashed = true; } });
 const state = { charX: startX, velocityX: 0, charFacing: -1, keysHeld: new Set(),
  hasBox: true, carriedCount: count, damageGauge: 0, stackCooldown: 0 };
 while (state.charX > 280 && !crashed && elapsed < 60) {
  if (stabilize && !resting && state.damageGauge >= 70) { resting = true; stops++; }
  if (resting && state.damageGauge <= 30) resting = false;
  state.keysHeld = new Set(resting ? [] : sprint ? ['left', 'shift'] : ['left']);
  physics.updateMovement(state, dt);
  physics.updateSensitivity(state, dt);
  elapsed += dt;
 }
 return { crashed, stops, elapsed, gauge: state.damageGauge, delivered: !crashed && state.charX <= 280 };
}

test('one and two boxes can walk the full route without stopping', () => {
 for (const dt of [1 / 120, 1 / 60, 1 / 30, .1]) {
  for (const count of [1, 2]) {
   assert.equal(simulateDelivery({ count, startX: 860, dt }).delivered, true, `${count} boxes at dt=${dt}`);
  }
 }
});

test('walking, sprinting and turn shocks scale in direct proportion to box count', () => {
 const physics = new LogisticsPhysicsEngine();
 for (const mode of ['walk', 'sprint', 'turn']) {
  const increases = [1, 2, 3, 4].map(count => {
   const state = { charX: 780, velocityX: -150, charFacing: -1,
    keysHeld: new Set(mode === 'turn' ? ['right'] : mode === 'sprint' ? ['left', 'shift'] : ['left']),
    hasBox: true, carriedCount: count, damageGauge: 0, stackCooldown: 0 };
   if (mode === 'turn') physics.updateMovement(state, .1);
   else physics.updateSensitivity(state, .1);
   return state.damageGauge;
  });
  increases.forEach((increase, i) => assert.ok(Math.abs(increase - increases[0] * (i + 1)) < 1e-9, `${mode}: ${i + 1} boxes`));
 }
});

test('three boxes need a pause on the full route and remain deliverable with stabilization', () => {
 for (const dt of [1 / 120, 1 / 60, 1 / 30, .1]) {
  assert.equal(simulateDelivery({ count: 3, dt }).crashed, true);
  const managed = simulateDelivery({ count: 3, startX: 860, dt, stabilize: true });
  assert.equal(managed.delivered, true);
  assert.ok(managed.elapsed < 15);
 }
});

test('four boxes crash without pauses even from the closest pickup point', () => {
 for (const dt of [1 / 120, 1 / 60, 1 / 30, .1]) {
  for (const startX of [560, 780, 860]) {
   const result = simulateDelivery({ count: 4, startX, dt });
   assert.equal(result.crashed, true, `start=${startX}, dt=${dt}`);
   assert.equal(result.delivered, false);
  }
 }
});

test('tutorial advice safely delivers four boxes with real deceleration and cooldown', () => {
 for (const dt of [1 / 120, 1 / 60, 1 / 30, .1]) {
  for (const startX of [560, 780, 860]) {
   const result = simulateDelivery({ count: 4, startX, dt, stabilize: true });
   assert.equal(result.delivered, true, `start=${startX}, dt=${dt}: ${JSON.stringify(result)}`);
   assert.ok(result.stops >= 1);
   assert.ok(result.elapsed < 15, 'a managed delivery must remain viable in a 60-second session');
  }
 }
});

test('sprinting a full stack reaches the crash threshold sooner than walking', () => {
 const walk = simulateDelivery({ count: 4 });
 const sprint = simulateDelivery({ count: 4, sprint: true });
 assert.equal(sprint.crashed, true);
 assert.ok(sprint.elapsed < walk.elapsed);
});
