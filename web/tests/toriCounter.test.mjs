import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Mesh, BoxGeometry, MeshBasicMaterial } from '../vendor/three/three.module.js';
import { nearToriCounter } from '../js/app/exhibition/ToriCounter.js';

test('Tori talk follows the actual desk front and also allows speaking beside Tori', () => {
    const room = new Group(), desk = new Mesh(new BoxGeometry(310, 72, 100), new MeshBasicMaterial());
    desk.name = 'cipher-cozy-desk'; desk.position.set(0, 36, -65); room.add(desk);
    const tori = new Group(); tori.name = 'tori-character'; tori.position.set(0, 0, -205); room.add(tori);
    const scene = { room };
    assert(nearToriCounter(scene, 0, 30));
    assert(nearToriCounter(scene, 165, 30));
    assert(nearToriCounter(scene, 70, -200));
    assert(!nearToriCounter(scene, 390, 169));
    assert(!nearToriCounter(scene, 0, 240));
});
