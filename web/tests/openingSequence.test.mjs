import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/app/OpeningSequence.js', import.meta.url), 'utf8')
    .replace('export function', 'function')
    .replace('import.meta.url', "'https://example.test/js/app/OpeningSequence.js'");

function setup() {
    const frame = {};
    const skip = { addEventListener(type, fn) { this.click = fn; }, focus() {} };
    let pending;
    const context = vm.createContext({ URL,
        setTimeout(fn, delay) { pending = { fn, delay }; return 1; },
        clearTimeout() { pending = null; }
    });
    vm.runInContext(source, context);
    const screen = { classList: { add() {} }, querySelector: tag => tag === 'iframe' ? frame : skip };
    return { frame, skip, run: context.playOpening(screen), timer: () => pending };
}

test('plays all six scenes for 140 seconds then completes', async () => {
    const state = setup();
    let completed = false;
    state.run.then(() => { completed = true; });
    let total = 0;
    for (let index = 1; index <= 6; index++) {
        assert.match(state.frame.src, new RegExp(`opening-scene-0${index}-v1/scene.html$`));
        const path = new URL(`../assets/opening/opening-scene-0${index}-v1/scene.html`, import.meta.url);
        assert.ok(fs.existsSync(path));
        state.frame.onload();
        total += state.timer().delay;
        assert.equal(completed, false);
        state.timer().fn();
    }
    await state.run;
    assert.equal(total, 140000);
    assert.equal(completed, true);
    assert.equal(state.timer(), null);
});

test('skip completes once and cancels the active scene timer', async () => {
    const state = setup();
    state.frame.onload();
    state.skip.click();
    state.skip.click();
    await state.run;
    assert.equal(state.timer(), null);
    assert.equal(state.frame.onload, null);
});
