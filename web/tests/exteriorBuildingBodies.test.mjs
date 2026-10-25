import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {createExteriorBuildingBodies,createExteriorBuildingBlocker} from '../js/components/town3d/ExteriorBuildingBodies.js';
import {installModelPreviewCollision} from '../js/components/town3d/TownModelCollision.js';
import {moveTownBody,recoverTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';

function fixture(){
    const model=new THREE.Group();model.position.set(1000,0,2000);
    for(const [name,width,height,depth,y] of [['Wall',100,120,80,60],['Roof',300,20,200,180]]){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth));
        mesh.name=name;mesh.position.y=y;model.add(mesh);
    }
    return createExteriorBuildingBodies(model,'test-building');
}

test('exterior bodies follow actual low walls and leave overhead eaves clear',()=>{
    const bodies=fixture(),blocked=createExteriorBuildingBlocker(bodies);
    assert.equal(bodies.length,1);assert.equal(bodies[0].mesh,'Wall');
    assert.equal(blocked(1091,2000*P),true);
    assert.equal(blocked(1093,2000*P),false);
    assert.equal(blocked(1000,2081*P),true);
    assert.equal(blocked(1000,2083*P),false);
    assert.equal(blocked(1100,2000*P),false);
    assert.equal(blocked(1079,2069*P),true);
    assert.equal(blocked(1081,2071*P),false);
});

test('all four approaches stop outside walls and embedded positions recover',()=>{
    globalThis.document={body:{classList:{contains:()=>true}}};
    const c={worldWidth:3700,worldHeight:2600,canStand:()=>true};
    installModelPreviewCollision(c,fixture());
    for(const [x,z,dx,dz] of [[850,2000,300,0],[1150,2000,-300,0],[1000,1850,0,300],[1000,2150,0,-300]]){
        c.charPosX=x;c.charPosY=z*P;moveTownBody(c,dx,dz*P);
        assert.equal(c.canStand(c.charPosX,c.charPosY),true);
        if(dx)assert.equal(Math.sign(c.charPosX-1000),Math.sign(x-1000));
        else assert.equal(Math.sign(c.charPosY/P-2000),Math.sign(z-2000));
    }
    c.charPosX=1000;c.charPosY=2000*P;
    assert.equal(recoverTownBody(c),true);
    assert.equal(c.canStand(c.charPosX,c.charPosY),true);
});
