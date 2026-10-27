import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {playOpening} from '../js/app/OpeningSequence.js';

class Caption extends EventTarget {
    constructor() {
        super(); this.textContent = '대사'; this.values = {};
        this.style = {setProperty: (key, value) => {this.values[key] = value;}};
    }
    setAttribute() {}
    focus() {}
}
function setup(t) {
    t.mock.method(globalThis, 'setTimeout', () => {throw Error('Opening must wait for input');});
    const previousAudio = globalThis.Audio;
    globalThis.Audio = class {constructor() {throw Error('Opening must remain silent');}};
    t.after(() => {if (previousAudio === undefined) delete globalThis.Audio; else globalThis.Audio = previousAudio;});
    const frame = new EventTarget(), skip = new EventTarget(); skip.focus = () => {};
    const screen = {classList: {add() {}}, querySelector: tag => tag === 'iframe' ? frame : skip};
    const run = playOpening(screen);
    const load = () => {
        const captions = [new Caption(), new Caption()];
        frame.contentDocument = {querySelectorAll: () => captions, querySelector: () => null};
        frame.dispatchEvent(new Event('load')); return captions;
    };
    return {frame, skip, run, load};
}
function input(caption, type = 'click', key, repeat = false) {
    const event = new Event(type, {cancelable: true});
    Object.assign(event, {key, repeat}); caption.dispatchEvent(event);
}
test('six silent scenes advance only after caption clicks or Enter/Space', async t => {
    const state = setup(t); let completed = false;
    state.run.then(() => {completed = true;});
    for (let index = 1; index <= 6; index++) {
        assert.match(state.frame.src, new RegExp(`opening-scene-0${index}-v1/scene.html$`));
        assert(existsSync(new URL(`../assets/opening/opening-scene-0${index}-v1/scene.html`, import.meta.url)));
        const [first, last] = state.load();
        assert.equal(first.values.display, 'block'); assert.equal(last.values.display, 'none');
        input(first, 'keydown', 'Escape'); input(first, 'keydown', 'Enter', true);
        assert.equal(first.values.display, 'block');
        await Promise.resolve(); assert.equal(completed, false);
        input(first, index % 2 ? 'click' : 'keydown', 'Enter');
        assert.equal(last.values.display, 'block');
        const before = state.frame.src;
        input(last, 'keydown', ' ');
        const after = state.frame.src;
        input(last); assert.equal(state.frame.src, after); // Old listeners cannot skip another scene.
        if (index < 6) assert.notEqual(before, after);
    }
    await state.run; assert.equal(completed, true);
});
test('skip completes once and removes caption and frame listeners', async t => {
    const state = setup(t), captions = state.load(); let completed = 0;
    state.run.then(() => {completed++;});
    state.skip.dispatchEvent(new Event('click')); await state.run;
    const before = state.frame.src;
    for (const caption of captions) input(caption);
    state.skip.dispatchEvent(new Event('click'));
    state.frame.dispatchEvent(new Event('load'));
    await Promise.resolve();
    assert.equal(state.frame.src, before); assert.equal(completed, 1);
    assert.equal(state.frame.onload, null); assert.equal(state.frame.onerror, null);
});
