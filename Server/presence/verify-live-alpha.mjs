import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import clientModule from '../../electron-app/src/presence-client.cjs';
import { registerNickname } from '../../web/js/engine/NicknameRegistration.js';

const url = 'https://stockwars-demo-presence.onrender.com';
const expectedRevision = process.argv[2];
assert.ok(expectedRevision, 'Supply the deployed commit revision');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockwars-live-alpha-'));
const clients = ['a', 'b'].map(id => new clientModule.PresenceClient({ url, tokenFile: path.join(dir, `${id}.json`) }));
const [a, b] = clients;
const suffix = randomBytes(3).toString('hex');
const nameA = `qa${suffix}a`, nameB = `qa${suffix}b`;
const report = { url, startedAt: new Date().toISOString(), checks: [], cleanup: [] };
const check = (name, condition) => { assert.ok(condition, name); report.checks.push(name); console.log(`PASS ${name}`); };
const success = result => { assert.ok(!result.error, result.error); assert.ok(result.snapshot); return result.snapshot; };
const bridge = client => ({ claimNickname: nickname => client.command('nickname', undefined, { nickname }) });
const pose = (nickname, x, y, facing = 'down') => ({ nickname, location: 'town', x, y, facing, resting: false });
let failed = false;
try {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200);
    report.health = await response.json();
    check('deployed revision and unique nickname capability', report.health.revision === expectedRevision && report.health.uniqueNicknames === true);
    const sessions = await Promise.all(clients.map(c => c.command('heartbeat')));
    sessions.forEach(success);
    check('two independent app sessions', sessions[0].snapshot.playerId !== sessions[1].snapshot.playerId);
    const registeredA = await registerNickname(nameA, bridge(a));
    check('app nickname registration confirmed', registeredA.pending === false);
    for (const duplicate of [nameA, nameA.toUpperCase(), ` ${nameA.slice(0, 2)} ${nameA.slice(2)} `]) {
        const denied = await b.command('nickname', undefined, { nickname: duplicate });
        check(`duplicate rejected (${report.checks.filter(s => s.startsWith('duplicate rejected')).length + 1})`, denied.status === 409 && /이미 사용 중/.test(denied.error));
    }
    await assert.rejects(registerNickname(nameA, bridge(b)), /이미 사용 중/);
    check('app blocks duplicate registration', true);
    check('different nickname registration confirmed', (await registerNickname(nameB, bridge(b))).pending === false);
    const joined = await Promise.all(clients.map(c => c.command('join', 'town-1')));
    joined.forEach(success);
    check('both clients join the same town', joined.every(r => r.snapshot.currentChannelId === 'town-1'));
    success(await a.command('position', undefined, pose(nameA, 700, 1000)));
    const fromB = success(await b.command('position', undefined, pose(nameB, 900, 1000)));
    check('client B sees client A position', fromB.players.some(p => p.id === a.snapshot.playerId && p.nickname === nameA && p.x === 700));
    const fromA = success(await a.command('position', undefined, pose(nameA, 720, 1010, 'right')));
    check('client A sees client B position', fromA.players.some(p => p.id === b.snapshot.playerId && p.nickname === nameB && p.x === 900));
    const moved = success(await b.command('position', undefined, pose(nameB, 920, 1020, 'left')));
    check('movement and facing reach the other client', moved.players.some(p => p.nickname === nameA && p.x === 720 && p.y === 1010 && p.facing === 'right'));
    check('town population includes both clients', moved.channels.find(c => c.id === 'town-1').users >= 2);
    const spoofed = await b.command('position', undefined, pose(nameA, 950, 1000));
    check('position cannot impersonate another nickname', spoofed.status === 409);
    success(await a.command('leave'));
    const afterLeave = success(await b.command('position', undefined, pose(nameB, 920, 1020)));
    check('departed player disappears', !afterLeave.players.some(p => p.nickname === nameA));
    success(await a.command('join', 'town-1'));
    success(await a.command('position', undefined, pose(nameA, 740, 1030)));
    const returned = success(await b.command('position', undefined, pose(nameB, 920, 1020)));
    check('rejoining restores shared presence', returned.players.some(p => p.nickname === nameA && p.x === 740));
    check('player snapshots never expose session tokens', !JSON.stringify(returned).includes(a.token) && !JSON.stringify(returned).includes(b.token));
    await a.stop({ deleteUser: true });
    check('deleted test guest releases its nickname', (await registerNickname(nameA, bridge(b))).pending === false);
} catch (error) {
    failed = true;
    report.error = error.message;
    console.error(`FAIL ${error.message}`);
} finally {
    for (const [index, client] of clients.entries()) {
        try { await client.stop({ deleteUser: true }); report.cleanup.push({ client: index + 1, deleted: true }); }
        catch (error) { failed = true; report.cleanup.push({ client: index + 1, deleted: false, error: error.message }); }
    }
    if (report.cleanup.every(c => c.deleted)) fs.rmdirSync(dir);
    report.finishedAt = new Date().toISOString();
    report.passed = !failed;
    const destination = path.resolve('output/alpha-test-2026-10-14/live-verification.json');
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify(report, null, 2));
    console.log(`Report: ${destination}`);
    process.exitCode = failed ? 1 : 0;
}
