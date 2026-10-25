import test from 'node:test';
import assert from 'node:assert/strict';
import { updateSomangiClearance, sidewaysYaw } from '../js/components/town3d/SomangiClearance.js';

test('two-sided passage enables crab movement and open space releases it', () => {
    const player = {};
    updateSomangiClearance(player, 1, 0, 0, 0, (x, z) => Math.abs(z) < 20);
    assert.equal(player.somangiCrabAuto, true);
    assert.equal(player.somangiCrab, true);
    updateSomangiClearance(player, 1, 0, 100, 0, () => true);
    assert.equal(player.somangiCrabAuto, false);
    assert.equal(player.somangiCrab, false);
});

test('stopping and reversing in a passage keeps the same side facing', () => {
    const player = {};
    updateSomangiClearance(player, 1, 0, 0, 0, (x,z) => Math.abs(z) < 20);
    const yaw = sidewaysYaw(player.somangiTravelAxis, 0);
    assert.ok(Math.abs(Math.sin(yaw)) < 1e-8);
    updateSomangiClearance(player, 0, 0, 0, 0, (x,z) => Math.abs(z) < 20);
    assert.equal(player.somangiCrab, true);
    updateSomangiClearance(player, -1, 0, 0, 0, (x,z) => Math.abs(z) < 20);
    assert.ok(Math.cos(sidewaysYaw(player.somangiTravelAxis, yaw) - yaw) > .999);
});

test('jump, seated and scripted movement suspend passage turning', () => {
    for (const flag of ['jumpActive', 'busSeated', 'scriptedWalking']) {
        const player = { [flag]: true, somangiCrab: true, somangiCrabAuto: true };
        updateSomangiClearance(player, 1, 0, 0, 0, (x,z) => Math.abs(z) < 20);
        assert.equal(player.somangiCrab, false, flag);
    }
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
