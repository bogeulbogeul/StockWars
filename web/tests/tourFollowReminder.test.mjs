import test from 'node:test';
import assert from 'node:assert/strict';
import { updateFollowDistance } from '../js/data/tourFollowReminder.js';

test('a sustained far gap calls once, without flicker or repeated interruptions', () => {
    const state = {};
    assert.equal(updateFollowDistance(state, 700, .4), null);
    assert.equal(updateFollowDistance(state, 600, .4), null);
    assert.equal(updateFollowDistance(state, 700, .4), null);
    assert.equal(updateFollowDistance(state, 700, .4), 'call');
    assert.equal(updateFollowDistance(state, 900, 3), null);
    assert.equal(updateFollowDistance(state, 500, 3), null);
    assert.equal(updateFollowDistance(state, 300, .1), 'near');
    assert.equal(updateFollowDistance(state, 700, .8), 'call');
});
