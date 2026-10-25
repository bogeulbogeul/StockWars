import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from '../vendor/three/three.module.js';
import {busStopSolidMesh,busStopSupportHeight} from '../js/components/town3d/BusStopGround.js';
import {moveTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';

test('shelter platform supports feet without becoming a solid wall',()=>{
    const platform=new Box3(new Vector3(0,0,0),new Vector3(200,12,100));
    assert.equal(busStopSolidMesh({name:'Smooth_Stone_Platform'}),false);
    assert.equal(busStopSolidMesh({name:'Bench_Seat'}),true);
    assert.equal(busStopSolidMesh({name:'Post'}),true);
    assert.equal(busStopSupportHeight(platform,100,50*P),12);
    assert.equal(busStopSupportHeight(platform,100,120*P),0);
});
test('moving from an occupied seat stands at a legal exit before walking',()=>{
    const c={busSeated:true,charPosX:0,charPosY:0,canStand:x=>x>=20};
    c.activeSeat={stand(){c.busSeated=false;c.charPosX=30;return true;}};
    moveTownBody(c,10,0);assert.equal(c.busSeated,false);assert.equal(c.charPosX,40);
    c.busSeated=true;c.activeSeat.stand=()=>false;
    moveTownBody(c,10,0);assert.equal(c.charPosX,40);
});
