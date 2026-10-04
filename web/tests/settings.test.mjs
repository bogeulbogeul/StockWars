import test from 'node:test';
import assert from 'node:assert/strict';
import { SettingsStore, DEFAULT_SETTINGS, normalizeSettings } from '../js/engine/SettingsStore.js';
import { LogisticsAudio } from '../js/components/logistics/LogisticsAudio.js';
import { settingsStore } from '../js/engine/SettingsStore.js';

test('settings validate stored values and recover from corrupt storage', () => {
    assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
    assert.equal(normalizeSettings({ effectsVolume: 200 }).effectsVolume, 100);
    assert.equal(normalizeSettings({ effectsVolume: -20 }).effectsVolume, 0);
    assert.deepEqual(normalizeSettings({ effectsVolume: 'bad', reducedMotion: 'false' }), DEFAULT_SETTINGS);
    const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const previousDocument = globalThis.document;
    let saved = '{broken';
    const classes = new Map();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => saved, setItem: (_key, value) => { saved = value; } } });
    globalThis.document = { body: { classList: { toggle: (key, value) => classes.set(key, value) } } };
    try {
        const store = new SettingsStore();
        assert.deepEqual(store.value, DEFAULT_SETTINGS);
        assert.equal(store.update({ effectsVolume: 0, reducedMotion: true, showWeather: false }), true);
        assert.equal(classes.get('settings-reduced-motion'), true);
        assert.equal(classes.get('settings-hide-weather'), true);
        assert.deepEqual(new SettingsStore().value, store.value);
        assert.equal(store.update(DEFAULT_SETTINGS), true);
        assert.equal(classes.get('settings-hide-weather'), false);
    } finally {
        if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
        else delete globalThis.localStorage;
        globalThis.document = previousDocument;
    }
});

test('zero effects volume prevents audio initialization', () => {
    const before = settingsStore.value.effectsVolume;
    settingsStore.value.effectsVolume = 0;
    try {
        const audio = new LogisticsAudio();
        audio.init = () => assert.fail('muted audio must not initialize');
        audio.playCrash();
        assert.equal(audio.audioCtx, null);
    } finally { settingsStore.value.effectsVolume = before; }
});
