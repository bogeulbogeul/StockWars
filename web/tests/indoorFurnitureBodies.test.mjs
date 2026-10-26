import {PLAYER_BODY_RADIUS as R} from '../js/components/town3d/CharacterBodies.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {installIndoorFurnitureBodies} from '../js/components/town3d/IndoorFurnitureBodies.js';
import {moveTownBody,recoverTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';

function fixture(){
    const room=new THREE.Group();
    for(const [name,size,y] of [['Desk',[100,60,60],30],['Floor',[800,5,800],0],
        ['Wall_Back',[800,200,10],100],['High_Shelf',[200,10,80],150],['Carpet',[180,2,80],2]]){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size));mesh.name=name;
        mesh.position.y=y;room.add(mesh);
        if(name==='Wall_Back')mesh.position.z=-350;
    }
    const npc=new THREE.Group();npc.name='moa-character';
    npc.add(new THREE.Mesh(new THREE.BoxGeometry(60,100,60)));room.add(npc);
    const owner={room,controller:{charPosX:0,charPosY:0}};
    installIndoorFurnitureBodies(owner,(x,z)=>Math.abs(x)<400&&Math.abs(z)<400);
    return owner;
}

test('desk blocks but floors, carpets, overhead shelves and characters are excluded',()=>{
    const owner=fixture();
    assert.deepEqual(owner.furnitureBodies.map(b=>b.mesh),['Desk']);
    assert.equal(owner.canStand(0,0),false);
    assert.equal(owner.canStand(0,74),true);
});

test('furniture blocks high speed approaches on all sides and recovers overlaps',()=>{
    const owner=fixture(),c=owner.controller;
    for(const [x,z,dx,dz] of [[-150,0,300,0],[150,0,-300,0],[0,-150,0,300],[0,150,0,-300]]){
        c.charPosX=x;c.charPosY=z*P;
        moveTownBody(c,dx,dz*P);
        assert.equal(c.canStand(c.charPosX,c.charPosY),true);
        if(dx)assert.equal(Math.sign(c.charPosX),Math.sign(x));
        else assert.equal(Math.sign(c.charPosY),Math.sign(z));
    }
    c.charPosX=0;c.charPosY=0;
    assert.equal(recoverTownBody(c),true);
    assert.equal(c.canStand(c.charPosX,c.charPosY),true);
});

test('furniture corners use the measured circular envelope rather than square padding',()=>{
    const owner=fixture();
    assert.equal(owner.canStand(50+R*.8,30+R*.8),true);
    assert.equal(owner.canStand(50+R*.6,30+R*.6),false);
    assert.equal(owner.canStand(50+R-1,0),false);
    assert.equal(owner.canStand(50+R+1,0),true);
});
