import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Quaternion, Vector3 } from '../vendor/three/three.module.js';
import { somangiFacingYaw, setSomangiFacing } from '../js/components/town3d/SomangiFacing.js';

test('standing up from a PI turn cannot reverse subsequent S/W facing', () => {
 const root=new Group(), y=new Vector3(0,1,0);
 root.quaternion.copy(new Quaternion().setFromAxisAngle(y,Math.PI));
 // XYZ Euler has an equivalent X/Z=PI representation after quaternion restore.
 assert(Math.abs(root.rotation.x)>3);
 assert(Math.abs(somangiFacingYaw(root)-Math.PI)<1e-8);
 for(const yaw of [0,Math.PI,Math.PI/2,-Math.PI/2]){
  root.quaternion.copy(new Quaternion().setFromAxisAngle(y,Math.PI));
  setSomangiFacing(root,yaw);
  const front=new Vector3(0,0,1).applyQuaternion(root.quaternion);
  assert(Math.abs(front.x-Math.sin(yaw))<1e-8);
  assert(Math.abs(front.z-Math.cos(yaw))<1e-8);
  assert.equal(root.rotation.x,0);assert.equal(root.rotation.z,0);
 }
});
