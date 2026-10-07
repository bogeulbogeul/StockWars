import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PresenceClient } = require('../../electron-app/src/presence-client.cjs');

test('local developer sessions never fetch presence, nicknames, chat or arena', async () => {
    let requests = 0;
    const client = new PresenceClient({ url: 'https://example.invalid', tokenFile: '', fetchImpl: async () => { requests++; throw new Error('Unexpected network request'); } });
    await client.setLocalMode(true);
    for (const action of ['heartbeat', 'nickname', 'join', 'position', 'leave']) {
        const result = await client.command(action, 'town-1', { nickname: 'Developer', x: 1, y: 2 });
        assert.equal(result.snapshot.local, true);
        assert.deepEqual(result.snapshot.players, []);
    }
    assert.ok((await client.chat('send', 'test')).error);
    assert.ok((await client.arena({ action: 'create' })).error);
    await client.stop();
    assert.equal(requests, 0);
});

test('switching online to local disconnects first and queued calls stay local; normal mode can reconnect', async () => {
    const calls = [];
    const client = new PresenceClient({ url: 'https://example.invalid', tokenFile: '', fetchImpl: async (_url, options) => {
        const action = JSON.parse(options.body).action;
        calls.push(action);
        return { ok: true, json: async () => ({ channels: [], players: [], currentChannelId: action === 'join' ? 'town-1' : null }) };
    } });
    await client.command('join', 'town-1');
    const switching = client.setLocalMode(true);
    const queued = client.command('position');
    await switching;
    assert.deepEqual((await queued).snapshot.players, []);
    assert.equal(calls.at(-1), 'disconnect');
    const count = calls.length;
    await client.command('heartbeat');
    await client.chat('list');
    assert.equal(calls.length, count);
    await client.setLocalMode(false);
    await client.command('join', 'town-1');
    assert.deepEqual(calls.slice(count), ['session', 'join']);
});
