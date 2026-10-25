import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {createCharacterBodies, charactersCanStand, PLAYER_BODY_RADIUS} from '../js/components/town3d/CharacterBodies.js';

test('NPC bodies block every direction using summed body radii',()=>{
    const scene=new THREE.Group(),npc=new THREE.Group();npc.name='moa-character';
    npc.add(new THREE.Mesh(new THREE.BoxGeometry(60,100,60)));scene.add(npc);
    const bodies=createCharacterBodies(scene),distance=PLAYER_BODY_RADIUS+bodies[0].radius;
    for(let i=0;i<16;i++){
        const angle=i*Math.PI/8;
        assert.equal(charactersCanStand(bodies,Math.cos(angle)*(distance-1),Math.sin(angle)*(distance-1)),false);
        assert.equal(charactersCanStand(bodies,Math.cos(angle)*(distance+1),Math.sin(angle)*(distance+1)),true);
    }
    assert.equal(npc.userData.rigidBody.type,'kinematic');
});

test('Bongbong is registered and rotation cannot shift the root-anchored body',()=>{
    const scene=new THREE.Group(),npc=new THREE.Group();npc.name='bongbong-character';
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(40,100,40));mesh.position.x=15;
    npc.add(mesh);scene.add(npc);
    const bodies=createCharacterBodies(scene);assert.equal(bodies.length,1);
    assert.ok(bodies[0].radius>=Math.hypot(35,20));
    npc.rotation.y=Math.PI/2;
    assert.equal(charactersCanStand(bodies,0,-35),false);
    npc.getWorldPosition(bodies[0].position);
    assert.equal(bodies[0].position.length(),0);
});

test('body follows parent/world motion and excludes the player',()=>{
    const scene=new THREE.Group(),parent=new THREE.Group(),npc=new THREE.Group();
    npc.name='tori-character';npc.add(new THREE.Mesh(new THREE.BoxGeometry(60,100,60)));
    parent.position.set(200,0,100);parent.add(npc);scene.add(parent);
    const player=new THREE.Group();player.name='somangi-player';scene.add(player);
    const bodies=createCharacterBodies(scene);assert.equal(bodies.length,1);
    npc.position.z=100;
    assert.equal(charactersCanStand(bodies,200,100),true);
    assert.equal(charactersCanStand(bodies,200,200),false);
});
