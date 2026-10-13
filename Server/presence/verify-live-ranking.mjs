import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import clientModule from '../../electron-app/src/presence-client.cjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockwars-ranking-'));
const clients = [0, 1].map(i => new clientModule.PresenceClient({ url: 'https://stockwars-demo-presence.onrender.com', tokenFile: path.join(dir, `${i}.json`) }));
const names = clients.map((_, i) => `rk${randomBytes(3).toString('hex')}${i}`);
const ok = r => { assert.ok(!r.error, r.error); return r; };
try {
    for (let i = 0; i < 2; i++) ok(await clients[i].command('nickname', undefined, { nickname: names[i] }));
    ok(await clients[0].chat('leaderboard', undefined, { profile: { netWorth: 12345, title: '트레이더' } }));
    let result = ok(await clients[1].chat('leaderboard', undefined, { profile: { netWorth: 0, title: '트레이더' } }));
    assert.equal(result.records.find(r => r.name === names[0]).netWorth, 12345);
    assert.equal(result.records.find(r => r.name === names[1]).netWorth, 0);
    console.log('PASS two users share server rankings, including zero assets');
    ok(await clients[0].chat('leaderboard', undefined, { profile: { netWorth: 23456, title: '업데이트' } }));
    result = ok(await clients[1].chat('leaderboard'));
    assert.equal(result.records.find(r => r.name === names[0]).netWorth, 23456);
    assert.equal(result.records.find(r => r.name === names[0]).title, '업데이트');
    assert.equal(result.records.find(r => r.name === names[1]).isMe, true);
    assert.equal(result.records.find(r => r.name === names[0]).weeklyReturn, null);
    console.log('PASS updated assets and title reach another user; seven-day return waits for history');
    await clients[0].stop({ deleteUser: true });
    result = ok(await clients[1].chat('leaderboard'));
    assert.ok(!result.records.some(r => r.name === names[0]));
    console.log('PASS test guest deletion removes its ranking');
} finally {
    await Promise.all(clients.map(c => c.stop({ deleteUser: true })));
    fs.rmdirSync(dir);
    console.log('Test guests cleaned up');
}
