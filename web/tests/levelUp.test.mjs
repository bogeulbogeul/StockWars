import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { LevelUpNotice } from '../js/components/LevelUpNotice.js';

test('level rewards survive reload, multi-level gains, and reject duplicate or invalid allocation', () => {
    let engine = new ItemEngine({ market: { cash: 0 } });
    assert.equal(engine.allocateLevelStat('analysis').success, false);
    engine.finishLabor(0, 400);
    assert.equal(engine.pendingStatPoints(), 2);
    assert.equal(engine.allocateLevelStat('stamina').success, false);
    assert.equal(engine.allocateLevelStat('recovery').success, true);
    engine = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
    assert.equal(engine.pendingStatPoints(), 1);
    assert.equal(engine.state.baseStats.recovery, 1);
    assert.equal(engine.allocateLevelStat('recovery').success, true);
    assert.equal(engine.maxStamina(), 4);
    assert.equal(engine.pendingStatPoints(), 0);
    assert.equal(engine.allocateLevelStat('analysis').success, false);
    assert.equal(engine.state.baseStats.analysis, 0);
});

test('legacy levels receive unspent choices without changing existing earned stats', () => {
    const engine = new ItemEngine();
    engine.state.exp = 400;
    engine.state.baseStats.analysis = 3;
    assert.equal(engine.pendingStatPoints(), 2);
    engine.allocateLevelStat('analysis');
    assert.equal(engine.state.baseStats.analysis, 4);
    engine.state.exp = 1e9;
    assert.equal(engine.pendingStatPoints(), 18);
});

test('selection only previews, confirmation spends once, and remaining points require a new selection', () => {
    const previousDocument = globalThis.document;
    const nodes = new Map();
    const node = () => ({ textContent: '', disabled: false, handlers: {}, setAttribute() {}, addEventListener(type, cb) { this.handlers[type] = cb; }, focus() {} });
    const buttons = ['analysis', 'negotiation', 'management', 'recovery'].map(key => ({ ...node(), dataset: { stat: key }, querySelector: () => node() }));
    const dialog = { ...node(), open: false, querySelectorAll: () => buttons, querySelector(selector) { if (selector === '[data-stat]') return buttons[0]; if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); }, showModal() { this.open = true; }, close() { this.open = false; } };
    globalThis.document = { createElement: () => dialog };
    try {
        const engine = new ItemEngine();
        engine.state.exp = 400;
        const modal = new LevelUpNotice({ append() {} }, { getState: () => ({ level: engine.playerLevel(), points: engine.pendingStatPoints(), stats: engine.state.baseStats }), onConfirm: key => engine.allocateLevelStat(key) });
        modal.audio = { playWin() {} };
        modal.show();
        const confirm = nodes.get('.level-up-confirm');
        assert.equal(confirm.disabled, true);
        buttons[0].handlers.click();
        assert.equal(engine.state.baseStats.analysis, 0);
        assert.match(nodes.get('.level-up-description').textContent, /찌라시/);
        buttons[3].handlers.click();
        assert.match(nodes.get('.level-up-description').textContent, /체력/);
        confirm.handlers.click();
        assert.equal(engine.state.baseStats.recovery, 1);
        assert.equal(confirm.disabled, true);
        confirm.handlers.click();
        assert.equal(engine.pendingStatPoints(), 1);
        buttons[0].handlers.click();
        confirm.handlers.click();
        assert.equal(engine.pendingStatPoints(), 0);
        assert.equal(dialog.open, false);
    } finally { globalThis.document = previousDocument; }
});
