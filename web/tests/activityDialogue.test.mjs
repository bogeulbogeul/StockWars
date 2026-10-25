import test from 'node:test';
import assert from 'node:assert/strict';
import { passiveActivity } from '../js/app/exhibition/ActivityDialogue.js';
import { freshState, complete } from '../js/app/exhibition/State.js';

test('passive activities use resident speech and advance only from its next arrow', () => {
    for (const id of ['phone', 'wage', 'envelope', 'sunset', 'cookie', 'grant', 'diary', 'tradeHistory']) {
        let line, advance;
        const calls = [];
        const app = { state: freshState(), view: { line: (beat, next) => { line = beat; advance = next; } }, next: id => calls.push(id) };
        assert(passiveActivity(app, id));
        assert(['모아', '봉봉', '소망이'].includes(line.speaker));
        assert(!line.text.includes('전시 체험'));
        assert.deepEqual(calls, []);
        advance(); assert.deepEqual(calls, [id]);
    }
});

test('walking has no confirmation screen and receiving wages still awards once', () => {
    const calls = [];
    assert(passiveActivity({ next: id => calls.push(id) }, 'walk'));
    assert.deepEqual(calls, ['walk']);
    const state = freshState(); state.flags.packing = true;
    let advance;
    passiveActivity({ state, view: { line: (_, next) => { advance = next; } }, next: id => complete(state, id) }, 'wage');
    assert.equal(state.cash, 0);
    advance(); advance();
    assert.equal(state.cash, 500);
});
