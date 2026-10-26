import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { createTownPropBodies } from '../js/components/town3d/TownPropBodies.js';
import { installModelPreviewCollision } from '../js/components/town3d/TownModelCollision.js';
import { moveTownBody, recoverTownBody } from '../js/components/town3d/TownBodyMovement.js';

test('arrival controller recovers a saved overlap and cannot reenter the bench', () => {
    const c = {charPosX:1000,charPosY:1500,worldWidth:3700,worldHeight:2600,canStand:()=>true};
    globalThis.document = {body:{classList:{contains:()=>true}}};
    const limits = {minX:900,maxX:1180,minY:1400,maxY:1600};
    installModelPreviewCollision(c,[{type:'static',minX:970,maxX:1030,minY:1490,maxY:1510}]);
    assert.equal(recoverTownBody(c, limits), true);
    assert.equal(c.canStand(c.charPosX,c.charPosY),true);
    assert.ok(c.charPosY>=1528);
    moveTownBody(c,0,-200,limits);
    assert.ok(c.charPosY>=1528);
});

test('fixed bodies include low solids and exclude overhead roofs', () => {
    const model = new THREE.Group();
    for (const [name, width, height, y] of [['trunk', 20, 150, 75], ['roof', 200, 10, 160]]) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 20));
        mesh.name = name; mesh.position.y = y; model.add(mesh);
    }
    model.position.set(1000, 0, 2000);
    const bodies = createTownPropBodies(model, 'tree');
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].mesh, 'trunk');
    assert.equal(bodies[0].minX, 990);
    assert.equal(model.userData.rigidBody.type, 'static');
});

test('prop bodies block movement from all four directions without tunnelling', async () => {
    globalThis.document = { body: { classList: { contains: () => true, toggle() {} } } };
    const { TownPlayerController } = await import('../js/components/town/TownPlayerController.js');
    const body = {type:'static', minX:990, maxX:1010, minY:1490, maxY:1510};
    for (const [x,y,key] of [[950,1500,'d'],[1050,1500,'a'],[1000,1450,'s'],[1000,1550,'w']]) {
        const controller = new TownPlayerController();
        installModelPreviewCollision(controller, [body]);
        controller.charPosX=x; controller.charPosY=y;
        controller.keysHeld.add(key); controller.keysHeld.add('shift');
        for (let i=0;i<30;i++) controller.update(.1,900,700);
        assert.equal(controller.canStand(controller.charPosX,controller.charPosY),true);
        if(key==='d') assert.ok(controller.charPosX<990);
        if(key==='a') assert.ok(controller.charPosX>1010);
        if(key==='s') assert.ok(controller.charPosY<1490);
        if(key==='w') assert.ok(controller.charPosY>1510);
    }
});
