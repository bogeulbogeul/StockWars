import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSomangiClearance } from '../js/components/town3d/SomangiClearance.js';

test('two-sided passage enables crab movement and open space releases it', () => {
    const player = {};
    updateSomangiClearance(player, 1, 0, 0, 0, (x, z) => Math.abs(z) < 20);
    assert.equal(player.somangiCrabAuto, true);
    assert.equal(player.somangiCrab, true);
    updateSomangiClearance(player, 1, 0, 100, 0, () => true);
    assert.equal(player.somangiCrabAuto, false);
    assert.equal(player.somangiCrab, false);
});

test('single wall does not trigger crab; manual mode and rest keep their contracts', () => {
    const player = {};
    updateSomangiClearance(player, 1, 0, 0, 0, (x, z) => z < 20);
    assert.equal(player.somangiCrab, false);
    player.somangiCrabManual = true;
    updateSomangiClearance(player, 0, 0, 0, 0, () => true);
    assert.equal(player.somangiCrab, true);
    player.isResting = true;
    updateSomangiClearance(player, 0, 0, 0, 0, () => true);
    assert.equal(player.somangiCrab, false);
    assert.equal(player.somangiCrabAuto, false);
    assert.equal(player.somangiCrabManual, false);
});
