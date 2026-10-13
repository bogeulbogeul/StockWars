import test from 'node:test';
import assert from 'node:assert/strict';
import { dogFrame, DOG_SCALE, dogSpriteSVG } from '../js/components/DogSprite.js';

test('left uses exact right frame and reflection for walk/carry/sit', () => {
    for (const state of [{ moving: true }, { moving: true, carrying: true }, { seated: true }]) {
        const right = dogFrame({ ...state, direction: 'right', time: 320 });
        const left = dogFrame({ ...state, direction: 'left', time: 320 });
        assert.deepEqual(left.rect, right.rect);
        assert.equal(left.state, right.state);
        assert.equal(left.flip, true);
    }
});
test('stopping uses idle and rear movement uses corrected rear row', () => {
    assert.equal(dogFrame({ direction: 'right', moving: false, time: 1234 }).state, 'right_idle');
    assert.equal(dogFrame({ direction: 'back', moving: true }).state, 'up_walk');
    assert.equal(dogFrame({ direction: 'front', seated: true }).state, 'down_sit');
});
test('standing reference is90; SVG world feet keep common origin', () => {
    assert.equal(330 * DOG_SCALE, 90);
    const svg = dogSpriteSVG({ direction: 'left', seated: true }, true);
    assert.match(svg, /scale\(-1 1\)/);
    assert.match(svg, /y="-101/);
});
