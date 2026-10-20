import test from 'node:test';
import assert from 'node:assert/strict';
import { BANK_ROOM, BANK_OBSTACLES, bankCanStand } from '../js/data/bankModelRoom.js';

test('bank spawn, exit and visitor approaches are reachable around furnished obstacles', () => {
    const start = [BANK_ROOM.spawn.x, BANK_ROOM.spawn.z];
    assert.equal(bankCanStand(...start), true);
    assert.equal(bankCanStand(0, BANK_ROOM.exitZ), true);
    assert.equal(bankCanStand(60, BANK_ROOM.exitZ), false);
    for (const b of BANK_OBSTACLES) {
        assert.equal(bankCanStand((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2), false, b.id);
    }
    const queue = [[0, 230]], seen = new Set(['0,230']);
    for (let i = 0; i < queue.length; i++) {
        const [x, z] = queue[i];
        for (const [dx, dz] of [[10, 0], [-10, 0], [0, 10], [0, -10]]) {
            const next = [x + dx, z + dz], key = next.join(',');
            if (!seen.has(key) && bankCanStand(...next)) { seen.add(key); queue.push(next); }
        }
    }
    for (const target of [[0, 60], [260, 100], [270, -140], [-220, 150], [-250, -180], [0, 320]]) {
        assert.equal(seen.has(target.join(',')), true, `approach ${target}`);
    }
});
