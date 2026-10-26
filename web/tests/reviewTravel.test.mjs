import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewTravelWait, REVIEW_TRAVEL_CANCELLED } from '../js/app/exhibition/ReviewTravel.js';
test('review cancellation rejects old journey and removes its animation callback', async () => {
    const frames = new Map(); let id = 0;
    globalThis.requestAnimationFrame = fn => { frames.set(++id, fn); return id; };
    globalThis.cancelAnimationFrame = key => frames.delete(key);
    const scenes = {}; let updates = 0;
    try {
        const waiting = reviewTravelWait(scenes, () => { updates++; });
        scenes.cancelReviewTravel();
        await assert.rejects(waiting, e => e === REVIEW_TRAVEL_CANCELLED);
        assert.equal(scenes.cancelReviewTravel, null);
        assert.equal(frames.size, 0);
        assert.equal(updates, 0);
    } finally { delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame; }
});
