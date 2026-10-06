import test from 'node:test';
import assert from 'node:assert/strict';
import { PresenceRegistry } from './registry.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('request persists after leaving town; only recipient accepts and both become friends', () => {
    const registry = new PresenceRegistry();
    const a = registry.session(), b = registry.session(), c = registry.session();
    registry.update(a.token, 'nickname', undefined, { nickname: '황금개미' });
    registry.update(b.token, 'nickname', undefined, { nickname: '새벽고래' });
    const call = (who, operation, targetId) => registry.chat(who.token, 'friends', undefined, { operation, targetId });
    call(a, 'request', b.playerId);
    assert.equal(call(b, 'list').incoming[0].name, '황금개미');
    assert.throws(() => call(a, 'request', b.playerId), /진행 중/);
    assert.throws(() => call(c, 'accept', a.playerId), /받은 요청/);
    assert.throws(() => call(a, 'chat', b.playerId), /수락 후/);
    registry.update(a.token, 'leave');
    call(b, 'accept', a.playerId);
    assert.equal(call(a, 'list').friends[0].name, '새벽고래');
    assert.equal(call(b, 'list').friends[0].name, '황금개미');
    assert.equal(registry.chatRooms.size, 0);
    const room = call(a, 'chat', b.playerId).roomId;
    assert.equal(call(a, 'chat', b.playerId).roomId, room);
    assert.equal(registry.chatRooms.size, 1);
    const listed = registry.chat(a.token, 'list').rooms[0];
    assert.equal(listed.direct, true);
    assert.equal(listed.title, '새벽고래');
    assert.equal(registry.chat(b.token, 'list').rooms[0].title, '황금개미');
    registry.chat(a.token, 'send', '안녕하세요', { roomId: room });
    const chatState = registry.chat(b.token, 'list', undefined, { roomId: room });
    assert.equal(chatState.messages[0].sender, '황금개미');
    assert.equal(chatState.players.find(player => player.id === a.playerId).name, '황금개미');
    assert.equal(registry.chat(b.token, 'list', undefined, { roomId: room }).messages[0].text, '안녕하세요');
    assert.throws(() => registry.chat(c.token, 'list', undefined, { roomId: room }), /참여 중/);
});

test('requests can be rejected and cancelled without becoming friends', () => {
    const registry = new PresenceRegistry();
    const a = registry.session(), b = registry.session();
    const call = (who, operation, targetId) => registry.chat(who.token, 'friends', undefined, { operation, targetId });
    call(a, 'request', b.playerId); call(b, 'reject', a.playerId);
    assert.equal(call(a, 'list').friends.length, 0);
    call(a, 'request', b.playerId); call(a, 'cancel', b.playerId);
    assert.equal(call(b, 'list').incoming.length, 0);
});

test('received requests and accepted friendships survive server restart', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockwars-friends-'));
    try {
        const nameFile = path.join(dir, 'names.json');
        let registry = new PresenceRegistry({ nameFile });
        const a = registry.session(), b = registry.session();
        registry.update(a.token, 'nickname', undefined, { nickname: '개미' });
        registry.update(b.token, 'nickname', undefined, { nickname: '고래' });
        registry.chat(a.token, 'friends', undefined, { operation: 'request', targetId: b.playerId });
        registry = new PresenceRegistry({ nameFile });
        const restoredA = registry.session(a.token); registry.session(b.token);
        assert.equal(registry.chat(b.token, 'friends', undefined, {}).incoming[0].name, '개미');
        registry.chat(b.token, 'friends', undefined, { operation: 'accept', targetId: restoredA.playerId });
        registry = new PresenceRegistry({ nameFile });
        registry.session(a.token); registry.session(b.token);
        assert.equal(registry.chat(a.token, 'friends', undefined, {}).friends[0].name, '고래');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('nickname search sends an offline request and both request lists reflect it', () => {
    const registry = new PresenceRegistry();
    const a = registry.session(), b = registry.session();
    registry.update(a.token, 'nickname', undefined, { nickname: '보내는친구' });
    registry.update(b.token, 'nickname', undefined, { nickname: 'Trader Kim' });
    registry.sessions.delete(b.token);
    const found = registry.friends(a.token, { operation: 'search', query: 'ＴＲＡＤＥＲkim' });
    assert.equal(found.players[0].name, 'Trader Kim');
    assert.equal(found.players[0].online, false);
    registry.friends(a.token, { operation: 'request', targetName: found.players[0].name });
    assert.equal(registry.friends(a.token).outgoing[0].name, 'Trader Kim');
    registry.session(b.token);
    assert.equal(registry.friends(b.token).incoming[0].name, '보내는친구');
    registry.friends(b.token, { operation: 'accept', targetName: '보내는친구' });
    assert.equal(registry.friends(a.token).friends[0].name, 'Trader Kim');
    assert.equal(registry.friends(a.token, { operation: 'search', query: '없는이름' }).players.length, 0);
});