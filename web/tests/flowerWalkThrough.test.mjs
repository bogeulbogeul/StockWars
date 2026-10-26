import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import { createTownPropBodies } from '../js/components/town3d/TownPropBodies.js';
import { createJumpBodies } from '../js/components/town3d/JumpCollision.js';

test('walk-through flower scenery cannot block walking or jumping', () => {
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(30, 150, 30)));
    model.position.y = 75;
    model.userData.walkThrough = true;
    assert.equal(createTownPropBodies(model, 'flowers').length, 0);
    assert.equal(createJumpBodies(model, 'flowers').length, 0);
    assert.equal(model.children.length, 1);
});

test('unmarked solid scenery keeps its ground and overhead colliders', () => {
    const model = new THREE.Group();
    model.add(new THREE.Mesh(new THREE.BoxGeometry(30, 150, 30)));
    model.position.y = 75;
    assert.ok(createTownPropBodies(model, 'solid').length > 0);
    assert.ok(createJumpBodies(model, 'solid').length > 0);
});
