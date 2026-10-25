import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.js';
import {presentSomangi} from '../js/app/exhibition/SomangiPresentation.js';

test('story dialogue preserves the position reached on foot, including repeated presentation', async () => {
    const controller = {charPosX: 210, charPosY: 180};
    const root = new THREE.Group(); root.position.set(210, 0, -80);
    const initial = root.position.clone();
    let expression, camera;
    const player = {root, ready: Promise.resolve(), setExpression: async mood => {expression = mood;},
        faceCamera(value) {camera = value;}};
    const scene = {controller, player, camera: new THREE.PerspectiveCamera()};
    const scenes = {place: 'information', rooms: new Map([['information', scene]]), townModelScene: {}};
    for (let i = 0; i < 2; i++) {
        await presentSomangi(scenes, {speaker: '소망이', text: '고마워!'});
        assert.deepEqual(root.position, initial);
        assert.deepEqual(controller, {charPosX: 210, charPosY: 180});
        assert.equal(expression, 'touched'); assert.equal(camera, scene.camera);
    }
});
