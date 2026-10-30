import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Bone, Mesh, BoxGeometry, MeshBasicMaterial, Box3, Quaternion, Vector3 } from '../vendor/three/three.module.js';
import { faceConversationPartner } from '../js/components/town3d/ConversationFacing.js';
import { MoaCharacter } from '../js/components/town3d/MoaCharacter.js';
import { SomangiPlayer } from '../js/components/town3d/SomangiPlayer.js';
import { uprightFacingYaw, turnUprightFacing } from '../js/components/town3d/SomangiFacing.js';
import { applySeatPose } from '../js/components/town3d/SeatPose.js';
import { createBusStopSeatPose } from '../js/components/town3d/BusStopSeatPose.js';
import { dismountPlayerSeat } from '../js/app/exhibition/PlayerSeatDismount.js';

function restoredRoot(){const r=new Group();r.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI));assert(Math.abs(r.rotation.x)>3);return r;}
function upright(root,yaw){assert.equal(root.rotation.x,0);assert.equal(root.rotation.z,0);const f=new Vector3(0,0,1).applyQuaternion(root.quaternion);assert(Math.abs(f.x-Math.sin(yaw))<1e-7);assert(Math.abs(f.z-Math.cos(yaw))<1e-7);}
for(const [label,run]of [
 ['common dialogue',(root,target)=>faceConversationPartner(root,target)],
 ['Moa dialogue',(root,target)=>MoaCharacter.prototype.faceTarget.call({root},target)],
 ['player immediate dialogue',(root,target)=>SomangiPlayer.prototype.faceTarget.call({root,town:{playerController:{}},update(){}},target)]
])test(label+' faces the actual partner after a restored quaternion',()=>{for(const [x,z]of [[0,100],[0,-100],[100,0],[-100,0]]){const root=restoredRoot(),target=new Group();target.position.set(x,0,z);run(root,target);upright(root,Math.atan2(x,z));}});

test('NPC smooth turn reads quaternion direction rather than ambiguous Euler Y',()=>{const root=restoredRoot();turnUprightFacing(root,0,.25);upright(root,Math.PI-.25);for(let i=0;i<20;i++)turnUprightFacing(root,0,.25);upright(root,0);});

function playerFixture(){const root=restoredRoot(),model=new Group();root.add(model);for(const name of ['LegL','LegR']){const b=new Bone();b.name=name;model.add(b);}const body=new Mesh(new BoxGeometry(20,20,20),new MeshBasicMaterial());body.isSkinnedMesh=true;body.skeleton={update(){}};model.add(body);return {root,variants:new Map([['walk',{model}]]),setState(){}};}
function chair(){const mesh=new Mesh(new BoxGeometry(80,10,80),new MeshBasicMaterial());mesh.name='Bench_Seat';mesh.position.y=20;mesh.updateMatrixWorld(true);return mesh;}

test('home, lobby and office shared seat pose normalizes restored root without changing seat facing',()=>{for(const f of [new Vector3(0,0,1),new Vector3(0,0,-1),new Vector3(1,0,0),new Vector3(-1,0,0)]){const p=playerFixture(),mesh=chair();const restore=applySeatPose(p,{forward:f,center:new Vector3(),forwardOffset:0,bounds:new Box3().setFromObject(mesh)});assert(restore);upright(p.root,Math.atan2(f.x,f.z));assert(p.root.userData.seated);restore();assert.equal(p.root.userData.seated,false);}});

test('bus stop sitting starts upright even after a restored half turn',()=>{const p=playerFixture(),stop=new Group();stop.add(chair());const restore=createBusStopSeatPose(p,stop,0);assert(restore);upright(p.root,0);restore();});

test('animated dismount itself leaves an upright root before controls or dialogue resume',async()=>{const p=playerFixture();p.holdFacing=function(){this.storyYaw=uprightFacingYaw(this.root);};const c={keysHeld:new Set()},room={player:p,controller:c,seatInteraction:{selected:{},stand(){p.root.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI));p.root.position.z=30;return true;}}};const saved=[globalThis.document,globalThis.requestAnimationFrame,globalThis.cancelAnimationFrame];let now=0;globalThis.document={hidden:false};globalThis.requestAnimationFrame=fn=>setImmediate(()=>{now+=50;fn(now);});globalThis.cancelAnimationFrame=clearImmediate;try{await dismountPlayerSeat(room);upright(p.root,Math.PI);assert.equal(c.busSeated,false);assert(Math.abs(p.storyYaw-Math.PI)<1e-7);}finally{[globalThis.document,globalThis.requestAnimationFrame,globalThis.cancelAnimationFrame]=saved;}});
