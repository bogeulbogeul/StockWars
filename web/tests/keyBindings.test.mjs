import test from 'node:test';
import assert from 'node:assert/strict';
import { settingsStore, SettingsStore, DEFAULT_SETTINGS } from '../js/engine/SettingsStore.js';
import { DEFAULT_KEY_BINDINGS, normalizeKeyBindings } from '../js/engine/KeyBindings.js';
import { gameKey, bindingLabel } from '../js/app/GameKeys.js';
import { TownPlayerController } from '../js/components/town/TownPlayerController.js';
import { SettingsModal } from '../js/components/SettingsModal.js';

const event = (code, extra = {}) => ({ code, key: code, preventDefault() {}, stopPropagation() {}, ...extra });
test('physical rebindings replace previous commands and preserve Korean layout and arrow controls', () => {
    const before = settingsStore.value;
    try {
        settingsStore.value = { ...before, keyBindings: { ...DEFAULT_KEY_BINDINGS, w: 'KeyZ', f: 'KeyQ', shift: 'Space', i: 'KeyB' } };
        assert.equal(gameKey(event('KeyQ', { key: 'ㅂ' })), 'f');
        assert.equal(gameKey(event('KeyF')), '');
        assert.equal(gameKey(event('KeyW')), '');
        assert.equal(gameKey(event('KeyB')), 'i');
        assert.equal(gameKey(event('Space')), 'shift');
        assert.equal(gameKey(event('ShiftRight')), '');
        assert.equal(gameKey(event('ArrowUp')), 'w');
        assert.equal(gameKey(event('KeyQ', { ctrlKey: true })), '');
        assert.equal(gameKey(event('KeyQ', { isComposing: true })), '');
        assert.equal(bindingLabel('f'), 'Q');
        const p = new TownPlayerController();
        p.handleKeyDown(event('Space')); p.handleKeyDown(event('KeyZ'));
        assert.ok(p.keysHeld.has('w')); assert.ok(p.keysHeld.has('shift'));
        p.handleKeyUp(event('Space')); p.handleKeyUp(event('KeyZ'));
        assert.equal(p.keysHeld.size, 0);
        p.handleKeyDown(event('KeyZ', { shiftKey: true }));
        assert.equal(p.keysHeld.has('shift'), false, 'former Shift key must not enable running');
    } finally { settingsStore.value = before; }
});

test('corrupt or conflicting maps fall back safely; valid swaps survive normalization', () => {
    assert.deepEqual(normalizeKeyBindings({ f: 'KeyW' }), DEFAULT_KEY_BINDINGS);
    assert.deepEqual(normalizeKeyBindings({ f: 'Escape' }), DEFAULT_KEY_BINDINGS);
    assert.deepEqual(normalizeKeyBindings({ f: 'KeyE' }), DEFAULT_KEY_BINDINGS);
    const swapped = { ...DEFAULT_KEY_BINDINGS, w: 'KeyF', f: 'KeyW' };
    assert.deepEqual(normalizeKeyBindings(swapped), swapped);
    assert.equal(normalizeKeyBindings({ shift: 'ShiftRight' }).shift, 'ShiftLeft');
});

test('settings key capture detects conflicts, cancels, saves and restores independently of sound preferences', () => {
    const previousDocument = globalThis.document, before = settingsStore.value;
    const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    let saved = '{}';
    const element = () => ({ dataset: {}, handlers: {}, setAttribute() {}, addEventListener(type, handler) { (this.handlers[type] ??= []).push(handler); }, fire(type, e = {}) { for (const fn of this.handlers[type] || []) fn(e); }, focus() {} });
    const nodes = new Map(), buttons = Object.keys(DEFAULT_KEY_BINDINGS).map(action => Object.assign(element(), { dataset: { bindAction: action } }));
    const dialog = Object.assign(element(), { querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }, querySelectorAll() { return buttons; }, showModal() { this.open = true; } });
    globalThis.document = { body: { classList: { toggle() {} } }, createElement: () => dialog, querySelectorAll: () => [] };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_k, v) => { saved = v; } } });
    try {
        settingsStore.value = { ...DEFAULT_SETTINGS, effectsVolume: 35 };
        const modal = new SettingsModal({ append() {} }, { canQuit: () => false });
        modal.open();
        const button = buttons.find(b => b.dataset.bindAction === 'f');
        button.fire('click'); dialog.fire('keydown', event('KeyW'));
        assert.equal(modal.pendingBinding, 'f'); assert.match(modal.keyStatus.textContent, /사용 중/);
        dialog.fire('keydown', event('KeyQ'));
        assert.equal(modal.pendingBinding, null); assert.equal(button.textContent, 'Q');
        assert.equal(new SettingsStore().value.keyBindings.f, 'KeyQ');
        button.fire('click'); dialog.fire('keydown', event('Escape', { key: 'Escape' }));
        assert.equal(modal.pendingBinding, null); assert.equal(settingsStore.value.keyBindings.f, 'KeyQ');
        dialog.querySelector('[data-action="reset-keys"]').fire('click');
        assert.deepEqual(settingsStore.value.keyBindings, DEFAULT_KEY_BINDINGS); assert.equal(settingsStore.value.effectsVolume, 35);
    } finally {
        settingsStore.value = before; globalThis.document = previousDocument;
        if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor); else delete globalThis.localStorage;
    }
});
