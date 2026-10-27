import test from 'node:test';
import assert from 'node:assert/strict';
import {TownMusic, getTownMusic} from '../js/engine/TownMusic.js';

test('retired music hooks remain callable without constructing or requesting audio', t => {
    for (const key of ['Audio', 'AudioContext', 'webkitAudioContext', 'fetch']) {
        const previous = globalThis[key];
        globalThis[key] = function () {throw Error(`Unexpected audio access: ${key}`);};
        t.after(() => {if (previous === undefined) delete globalThis[key]; else globalThis[key] = previous;});
    }
    const music = getTownMusic();
    assert(music instanceof TownMusic); assert.equal(getTownMusic(), music);
    for (const title of [true, false, true]) music.setTitleActive(title);
    for (const currentStage of ['dawn', 'day', 'sunset', 'night']) {
        music.update({currentStage}, false); music.update({currentStage}, true);
    }
    assert.equal(music.context, undefined); assert.equal(music.master, undefined);
});
