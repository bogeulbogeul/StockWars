import test from 'node:test';
import assert from 'node:assert/strict';
import { exhibitionSkyTime } from '../js/data/exhibitionSkyTime.js';

test('first day stays daytime until the script sunset flag', () => {
    assert.equal(exhibitionSkyTime(), 'day');
    assert.equal(exhibitionSkyTime({ trade: true, packing: true }), 'day');
    assert.equal(exhibitionSkyTime({ sunset: true }), 'sunset');
});

test('sleep takes precedence over saved sunset and a restart returns to day', () => {
    assert.equal(exhibitionSkyTime({ sunset: true, asleep: true }), 'night');
    assert.equal(exhibitionSkyTime({ asleep: true }), 'night');
    assert.equal(exhibitionSkyTime({ sunset: false, asleep: false }), 'day');
});
