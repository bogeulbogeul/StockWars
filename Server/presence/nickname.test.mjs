import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PresenceRegistry } from './registry.mjs';

test('names are atomic, normalized, owned by session and reserved after disconnect', () => {
    const registry = new PresenceRegistry();
    const a = registry.session().token, b = registry.session().token;
    registry.update(a, 'nickname', undefined, { nickname: 'Trader Kim' });
    assert.throws(() => registry.update(b, 'nickname', undefined, { nickname: 'ＴＲＡＤＥＲkim' }), /이미 사용 중/);
    registry.update(a, 'nickname', undefined, { nickname: 'Trader Kim' });
    registry.update(a, 'disconnect');
    assert.throws(() => registry.update(b, 'nickname', undefined, { nickname: 'trader kim' }), /이미 사용 중/);
    registry.update(b, 'join', 'town-1');
    assert.throws(() => registry.update(b, 'position', undefined, { x: 100, y: 100, facing: 'down', nickname: 'Trader Kim' }), /이미 사용 중/);
    assert.throws(() => registry.update(b, 'nickname', undefined, { nickname: ' ' }), /1~10/);
});

test('reservations survive server restart and original session can reclaim name', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockwars-names-'));
    const nameFile = path.join(dir, 'names.json');
    try {
        const first = new PresenceRegistry({ nameFile });
        const token = first.session().token;
        first.update(token, 'nickname', undefined, { nickname: '황금개미' });
        const restarted = new PresenceRegistry({ nameFile });
        const other = restarted.session().token;
        assert.throws(() => restarted.update(other, 'nickname', undefined, { nickname: '황금개미' }), /이미 사용 중/);
        assert.equal(restarted.session(token).token, token);
        restarted.update(token, 'nickname', undefined, { nickname: '황금개미' });
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
