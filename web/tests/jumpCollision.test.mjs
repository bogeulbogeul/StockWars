import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {createJumpBodies,installJumpCollision} from '../js/components/town3d/JumpCollision.js';
import {moveTownBody} from '../js/components/town3d/TownBodyMovement.js';

function fixture(){
    const model=new THREE.Group();
    for(const [name,y] of [['Low_Overhang',112],['High_Roof',200],['Low_Table',50]]){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(80,10,80));
        mesh.name=name;mesh.position.y=y;model.add(mesh);
    }
    return createJumpBodies(model,'fixture');
}

test('only overhead geometry within the full jump height is added',()=>{
    const bodies=fixture();
    assert.deepEqual([...new Set(bodies.map(b=>b.mesh))],['Low_Overhang']);
});

test('a raised support floor extends jump clearance to its actual head height',()=>{
    const model=new THREE.Group(),header=new THREE.Mesh(new THREE.BoxGeometry(80,4,80));
    header.position.y=130;header.name='Header';model.add(header);
    assert.equal(createJumpBodies(model,'stop').length,0);
    assert.ok(createJumpBodies(model,'stop',{supportHeight:12}).length>0);
});

test('walking beneath an overhang stays legal but jumping into it is denied',()=>{
    const c={};installJumpCollision(c,()=>true,fixture());
    assert.equal(c.canStand(0,0),true);
    assert.equal(c.canJumpAt(0,0),false);
    assert.equal(c.canJumpAt(100,0),true);
    c.jumpActive=true;assert.equal(c.canStand(0,0),false);
    c.jumpActive=false;assert.equal(c.canStand(0,0),true);
});

test('airborne movement cannot cross overhead solids and ground walls remain solid',()=>{
    const c={charPosX:-100,charPosY:0,jumpActive:true};
    installJumpCollision(c,(x)=>x<150||x>170,fixture());
    moveTownBody(c,200,0);
    assert.ok(c.charPosX<=-82);
    assert.equal(c.canStand(c.charPosX,c.charPosY),true);
    c.jumpActive=false;moveTownBody(c,200,0);
    assert.ok(c.charPosX>40&&c.charPosX<150);
    c.jumpActive=true;
    assert.equal(c.canStand(160,0),false);
    assert.equal(c.canJumpAt(160,0),false);
});
