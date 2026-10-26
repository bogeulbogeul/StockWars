import test from 'node:test';
import assert from 'node:assert/strict';
import { exhibitionSkyTime, hasExhibitionSunset } from '../js/data/exhibitionSkyTime.js';

test('either activity order prepares sunset as soon as both activities finish', () => {
    assert.equal(hasExhibitionSunset({ packing: true }), false);
    assert.equal(hasExhibitionSunset({ trade: true }), false);
    assert.equal(hasExhibitionSunset({ packing: true, trade: true }), true);
    assert.equal(hasExhibitionSunset({ sunset: true }), true);
    assert.equal(hasExhibitionSunset({}), false);
});

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
