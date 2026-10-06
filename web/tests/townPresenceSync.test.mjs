import test from 'node:test';
import assert from 'node:assert/strict';
import { TownPresenceSync } from '../js/components/town/TownPresenceSync.js';
test('late position responses cannot reinsert players after leaving town', async () => {
    let resolve, sent;
    const snapshots = [];
    const stage = { nickname: 'A', playerController: { charPosX: 700, charPosY: 900, facing: 'down', isResting: false },
        setRemotePlayers: players => snapshots.push(players) };
    const sync = new TownPresenceSync(stage, { position: pose => { sent = pose; return new Promise(r => resolve = r); } });
    sync.start();
    assert.equal(sent.x, 700);
    sync.stop();
    resolve({ snapshot: { players: [{ id: 2, x: 800, y: 900 }] } });
    await Promise.resolve();
    assert.deepEqual(snapshots, []);
});
