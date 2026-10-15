import test from 'node:test';
import assert from 'node:assert/strict';
import { installAnnaInputGuard } from '../js/components/tutorial/annaInputGuard.js';

function setup() {
    const listeners = new Map();
    const host = { addEventListener: (type, fn, options) => { assert.equal(options.capture, true); listeners.set(type, fn); }, removeEventListener: type => listeners.delete(type) };
    const tutorial = { isActive: true, historyCursor: null, currentStepIdx: 0, steps: [{ id: 'welcome_1' }], overlay: { classList: { contains: () => false } }, dialogueBox: { contains: target => target.dialogue === true }, inputKey: event => event.key };
    const dispose = installAnnaInputGuard(tutorial, host);
    const send = (type, target = {}, key = '') => {
        let blocked = false, stopped = false;
        listeners.get(type)?.({ type, target, key, isTrusted: true, preventDefault() { blocked = true; }, stopImmediatePropagation() { stopped = true; } });
        assert.equal(blocked, stopped);
        return blocked;
    };
    return { tutorial, send, dispose, listeners };
}

test('dialogue blocks scene clicks and keyboard, including shortcuts on focused buttons', () => {
    const { send } = setup();
    for (const type of ['click', 'pointerdown', 'mousedown', 'touchstart', 'wheel']) assert.equal(send(type), true);
    assert.equal(send('click', { dialogue: true }), false);
    for (const key of ['w', 'p', 'i', 'Escape', 'Tab', 'Enter', ' ']) assert.equal(send('keydown', { dialogue: true }, key), true);
    assert.equal(send('keyup', {}, 'w'), false);
});

test('manual step permits only its target and history cannot operate the scene', () => {
    const { tutorial, send } = setup();
    tutorial.steps = [{ id: 'open_phone', requiresManualAction: true, targetSelector: '#floatingPhoneBtn' }];
    const target = { closest: selector => selector === '#floatingPhoneBtn' };
    assert.equal(send('click', target), false);
    assert.equal(send('click', { closest: () => false }), true);
    assert.equal(send('keydown', target, 'p'), true);
    tutorial.historyCursor = 0;
    assert.equal(send('click', target), true);
});

test('movement practice permits movement only; hidden or completed tutorials release input', () => {
    const { tutorial, send, dispose, listeners } = setup();
    tutorial.steps = [{ id: 'enter_logistics', requiresManualAction: true }];
    assert.equal(send('keydown', {}, 'w'), false);
    assert.equal(send('keydown', {}, 'p'), true);
    tutorial.overlay.classList.contains = () => true;
    assert.equal(send('click'), false);
    tutorial.overlay.classList.contains = () => false;
    tutorial.isActive = false;
    assert.equal(send('keydown', {}, 'p'), false);
    dispose(); assert.equal(listeners.size, 0);
});


test('chart exploration permits drag and scroll in both the current lesson and history', () => {
    const { tutorial, send } = setup();
    const graph = { id: 'chart_tour_graph', allowedSelector: '#detailedChartScrollWrapper' };
    const target = { closest: selector => selector === graph.allowedSelector };
    tutorial.steps = [graph];
    tutorial.dialogueHistory = [graph];
    for (const cursor of [null, 0]) {
        tutorial.historyCursor = cursor;
        for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'wheel']) {
            assert.equal(send(type, target), false, `${type} at history ${cursor}`);
        }
        assert.equal(send('click', { closest: () => false }), true);
        assert.equal(send('keydown', target, 'p'), true);
    }
    tutorial.historyCursor = null;
    tutorial.steps = [{ id: 'chart_tour_metrics' }];
    assert.equal(send('pointerdown', target), true);
});


test('replayed close instructions allow only the highlighted X outside the dialogue', () => {
    const { tutorial, send } = setup();
    tutorial.historyCursor = 0;
    tutorial.dialogueHistory = [{ targetSelector: '#btnCloseTradeModal' }];
    assert.equal(send('click', { closest: selector => selector === '#btnCloseTradeModal' }), false);
    assert.equal(send('click', { closest: () => false }), true);
});


test('app launch replay permits the stock icon but blocks unrelated apps', () => {
    const { tutorial, send } = setup();
    tutorial.historyCursor = 0;
    tutorial.dialogueHistory = [{ id: 'launch_stock_app', targetSelector: '#iconStockApp' }];
    assert.equal(send('click', { closest: selector => selector === '#iconStockApp' }), false);
    assert.equal(send('click', { closest: () => false }), true);
});
