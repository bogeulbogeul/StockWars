import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {installIndoorWallBodies} from '../js/components/town3d/IndoorWallBodies.js';
import {moveTownBody,recoverTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';

function fixture(){
    const room=new THREE.Group(),geometry=new THREE.BufferGeometry();
    const positions=[];
    for(const x of [-80,80]){
        const panel=new THREE.BoxGeometry(60,160,10).toNonIndexed();
        panel.translate(x,80,0);
        positions.push(...panel.attributes.position.array);
    }
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const wall=new THREE.Mesh(geometry);wall.name='Room_Side_Wall';wall.visible=false;
    room.add(wall);
    const owner={room,controller:{charPosX:0,charPosY:0}};
    installIndoorWallBodies(owner,(x,z)=>Math.abs(x)<300&&Math.abs(z)<300);
    return owner;
}

test('single-mesh doorway stays open while hidden wall panels remain solid',()=>{
    const owner=fixture();
    assert.ok(owner.wallBodies.length>1);
    assert.equal(owner.canStand(0,0),true);
    assert.equal(owner.canStand(80,0),false);
    assert.equal(owner.canStand(80,46),false);
    assert.equal(owner.canStand(80,48),true);
});

test('wall blocks high speed movement and restores a body embedded in the wall',()=>{
    const owner=fixture(),c=owner.controller;
    c.charPosX=80;c.charPosY=100*P;
    moveTownBody(c,0,-200*P);
    assert.ok(c.charPosY/P>=43);
    c.charPosY=0;
    assert.equal(recoverTownBody(c),true);
    assert.equal(c.canStand(c.charPosX,c.charPosY),true);
    c.charPosX=0;c.charPosY=100*P;
    moveTownBody(c,0,-200*P);
    assert.ok(c.charPosY<0);
});
