import test from 'node:test';
import assert from 'node:assert/strict';
import { SomangiJump, SOMANGI_JUMP } from '../js/components/town3d/SomangiJump.js';

test('short hop peaks at twenty units and lands at exactly ground level', () => {
    const jump = new SomangiJump();
    assert.equal(jump.start(), true);
    assert.equal(jump.update(SOMANGI_JUMP.duration / 2), 20);
    assert.equal(jump.update(SOMANGI_JUMP.duration / 2), 0);
    assert.equal(jump.active, false);
    assert.equal(jump.update(100), 0);
});
test('airborne repeat cannot restart or stack a jump', () => {
    const jump = new SomangiJump(); jump.start(); jump.update(.2);
    const elapsed = jump.elapsed;
    assert.equal(jump.start(), false); assert.equal(jump.elapsed, elapsed);
    jump.update(1); assert.equal(jump.start(), true); assert.equal(jump.offset, 0);
});
test('variable frame intervals stay above ground, land, and cancel cleanly', () => {
    const jump = new SomangiJump(); jump.start();
    for (const dt of [.016, .033, .1, .05, .2, .3]) {
        const offset = jump.update(dt); assert.ok(offset >= 0 && offset <= 20);
    }
    assert.equal(jump.active, false);
    jump.start(); jump.update(.2); jump.cancel(); assert.equal(jump.offset, 0); assert.equal(jump.active, false);
});
