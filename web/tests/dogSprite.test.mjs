import test from 'node:test';
import assert from 'node:assert/strict';
import { dogFrame, DOG_SCALE, dogSpriteSVG } from '../js/components/DogSprite.js';
import { CHARACTER_HEIGHT } from '../js/data/characterScale.js';

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
test('unified standing reference is H90; every world pose keeps the same foot origin', () => {
    assert.equal(449 * DOG_SCALE, CHARACTER_HEIGHT);
    for (const pose of [{}, { moving: true }, { carrying: true, moving: true }, { seated: true }]) {
        for (const direction of ['down', 'right', 'up', 'left']) {
            const svg = dogSpriteSVG({ ...pose, direction, time: 320 }, true);
            const outer = svg.match(/^<svg\b[^>]*>/)[0];
            const attr = name => Number(outer.match(new RegExp(`\\b${name}="([^"]+)"`))[1]);
            assert.equal(attr('width'), 512 * DOG_SCALE);
            assert.equal(attr('height'), 488 * DOG_SCALE);
            assert.equal(attr('x') + 256 * DOG_SCALE, 0);
            assert.equal(attr('y') + 488 * DOG_SCALE, 0);
            assert.match(outer, /viewBox="0 0 512 488"/);
            if (direction === 'left') assert.match(svg, /translate\(512 0\) scale\(-1 1\)/);
            else assert.doesNotMatch(svg, /scale\(-1 1\)/);
        }
    }
});
