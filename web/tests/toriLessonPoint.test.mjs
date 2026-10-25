import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Quaternion, Vector3 } from '../vendor/three/three.module.js';
import { safeLessonPoint } from '../js/app/exhibition/ToriLessonBoard.js';

test('Tori never points backward or rotates the arm beyond 45 degrees', () => {
    const root = new Group(), arm = new Group(); root.add(arm);
    const rest = new Quaternion();
    safeLessonPoint(root, arm, rest, new Vector3(0,100,-200));
    assert(arm.quaternion.angleTo(rest) < 1e-6);
    safeLessonPoint(root, arm, rest, new Vector3(0,100,200));
    assert(arm.quaternion.angleTo(rest) <= Math.PI/4+1e-6);
});
