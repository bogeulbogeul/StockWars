import test from 'node:test';
import assert from 'node:assert/strict';
import { clearDemoRecords, DEMO_END_KEY, isFinalSettlement } from '../js/app/DemoLifecycle.js';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { DemoLifecycle } = require('../../electron-app/src/demo-lifecycle.cjs');
const { PresenceClient } = require('../../electron-app/src/presence-client.cjs');

test('day 7 paid and unpaid settlements finish; earlier previews do not', () => {
    for (const rentPaid of [true, false]) {
        assert.equal(isFinalSettlement({ day: 7, rentPaid }), true);
        assert.equal(isFinalSettlement({ day: 6, rentPaid }), false);
    }
    assert.equal(isFinalSettlement(null), false);
});

test('run cleanup removes all game namespaces but preserves completion marker and unrelated data', () => {
    const data = new Map([[DEMO_END_KEY, 'pending'], ['stockwars-item-gameplay-v1', 'save'],
        ['stockwars_favorites', 'stocks'], ['stockwars.bubble.friends.v1', 'friends'], ['other-app', 'keep']]);
    clearDemoRecords({ get length() { return data.size; }, key: i => [...data.keys()][i], removeItem: key => data.delete(key) });
    assert.deepEqual([...data], [[DEMO_END_KEY, 'pending'], ['other-app', 'keep']]);
});

test('failed deletion blocks restart, persists across launches, and retries before restart', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-demo-'));
    try {
        let fail = true, started = 0;
        const presence = { stop: async ({ deleteUser }) => { assert.ok(deleteUser); if (fail) throw new Error('offline'); }, start: () => started++ };
        const markerFile = path.join(dir, 'ended.json');
        let demo = new DemoLifecycle({ markerFile, presence });
        demo.mark();
        await assert.rejects(demo.discard(), /offline/);
        assert.throws(() => demo.restart(), /삭제/);
        demo = new DemoLifecycle({ markerFile, presence });
        assert.deepEqual(demo.status(), { ended: true, complete: false });
        fail = false;
        await demo.discard();
        assert.equal(presence.deletionLocked, true);
        demo.restart();
        assert.equal(demo.status().ended, false);
        assert.equal(presence.deletionLocked, false);
        assert.equal(started, 1);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('late client calls cannot recreate a deleted account; missing server does not lose token', async () => {
    let fetched = 0;
    const client = new PresenceClient({ url: '', tokenFile: 'absent-demo-test', fetchImpl: async () => { fetched++; } });
    client.token = 'old-user'; client.deletionLocked = true;
    await Promise.all([client.command('heartbeat'), client.chat('leaderboard'), client.arena({ action: 'history' }), client.setLocalMode(false)]);
    assert.equal(fetched, 0);
    await assert.rejects(client.stop({ deleteUser: true }), /서버 주소/);
    assert.equal(client.token, 'old-user');
});
