import test from 'node:test';
import assert from 'node:assert/strict';
import { PresenceRegistry } from './registry.mjs';
import { createPresenceServer } from './server.mjs';
import clientModule from '../../electron-app/src/presence-client.cjs';

test('leaving removes membership, prevents reading and deletes the last empty room', () => {
    const registry = new PresenceRegistry();
    const a = registry.session().token;
    const b = registry.session().token;
    const bId = registry.chat(b, 'list').playerId;
    const { roomId } = registry.chat(a, 'create', undefined, { title: '나가기 테스트', members: [bId] });
    registry.chat(a, 'leaveRoom', undefined, { roomId });
    assert.equal(registry.chat(a, 'list').rooms.length, 0);
    assert.equal(registry.chat(b, 'list').rooms[0].count, 1);
    assert.throws(() => registry.chat(a, 'list', undefined, { roomId }), { status: 403 });
    registry.chat(b, 'leaveRoom', undefined, { roomId });
    assert.equal(registry.chatRooms.has(roomId), false);
});

test('create a room alone and invite a friend afterward', () => {
    const registry = new PresenceRegistry();
    const a = registry.session().token;
    const b = registry.session().token;
    const c = registry.session().token;
    const bId = registry.chat(b, 'list').playerId;
    const { roomId } = registry.chat(a, 'create', undefined, { title: '새 방', members: [] });
    assert.equal(registry.chat(a, 'list').rooms[0].count, 1);
    assert.throws(() => registry.chat(c, 'invite', undefined, { roomId, members: [bId] }), { status: 403 });
    registry.chat(a, 'invite', undefined, { roomId, members: [bId] });
    registry.chat(a, 'invite', undefined, { roomId, members: [bId] });
    assert.equal(registry.chat(b, 'list').rooms[0].count, 2);
});

test('profit posts reach another player and reactions cannot be repeated', () => {
    const registry = new PresenceRegistry();
    const a = registry.session().token;
    const b = registry.session().token;
    const achievement = { id: 'sale-1', stockName: '삼성전자', profit: 1500, returnRate: 15, quantity: 2 };
    registry.chat(a, 'newsPublish', undefined, { achievement, comment: '성투!' });
    const post = registry.chat(b, 'news').posts[0];
    assert.equal(post.comment, '성투!');
    assert.match(post.message, /1,500G/);
    assert.equal(post.isOwn, false);
    assert.throws(() => registry.chat(a, 'newsPublish', undefined, { achievement }), { status: 400 });
    assert.throws(() => registry.chat(a, 'newsReact', undefined, { postId: post.id, reaction: 'congratulate' }), { status: 400 });
    registry.chat(b, 'newsReact', undefined, { postId: post.id, reaction: 'congratulate' });
    assert.equal(registry.chat(a, 'news').posts[0].reactionCount, 1);
    assert.throws(() => registry.chat(b, 'newsReact', undefined, { postId: post.id, reaction: 'hate' }), { status: 400 });
});

test('invited players share a room while outsiders cannot read or send', () => {
    const registry = new PresenceRegistry();
    const a = registry.session().token;
    const b = registry.session().token;
    const c = registry.session().token;
    const bId = registry.chat(b, 'list').playerId;
    const { roomId } = registry.chat(a, 'create', undefined, { title: '투자 친구들', members: [bId] });
    assert.equal(registry.chat(b, 'list').rooms[0].id, roomId);
    registry.chat(a, 'send', '안녕하세요', { roomId });
    assert.equal(registry.chat(b, 'list', undefined, { roomId }).messages[0].text, '안녕하세요');
    assert.equal(registry.chat(b, 'list').messages.length, 0);
    assert.equal(registry.chat(c, 'list').rooms.length, 0);
    assert.throws(() => registry.chat(c, 'list', undefined, { roomId }), { status: 403 });
    assert.throws(() => registry.chat(c, 'send', '침입', { roomId }), { status: 403 });
    assert.throws(() => registry.chat(a, 'create', undefined, { title: '방', members: [999] }), { status: 400 });
});

test('two players exchange messages through the client and HTTP server without exposing tokens', async t => {
    const server = createPresenceServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}`;
    const players = [new clientModule.PresenceClient({ url, tokenFile: 'unused' }), new clientModule.PresenceClient({ url, tokenFile: 'unused' })];
    // Supply independent guest sessions without writing token files.
    for (const player of players) {
        const response = await fetch(`${url}/api/presence`, { method: 'POST', body: JSON.stringify({ action: 'session' }) });
        const data = await response.json();
        player.token = data.token;
        player.snapshot = data;
    }
    const sent = await players[0].chat('send', '<script>alert(1)</script> 안녕하세요');
    assert.equal(sent.messages.length, 1);
    const received = await players[1].chat('list');
    assert.notEqual(received.playerId, sent.playerId);
    assert.equal(received.messages[0].text, '<script>alert(1)</script> 안녕하세요');
    assert.ok(!JSON.stringify(received).includes(players[0].token));
    const reply = await players[1].chat('send', '반갑습니다');
    assert.equal(reply.messages.length, 2);
    assert.equal((await players[0].chat('list')).messages[1].sender, `플레이어 ${received.playerId}`);
    const denied = await fetch(`${url}/api/chat`, { method: 'POST', body: JSON.stringify({ action: 'list' }) });
    assert.equal(denied.status, 401);
});

test('chat validates messages, limits spam and history, rejects expired sessions', () => {
    let now = 100000;
    const registry = new PresenceRegistry({ now: () => now });
    const token = registry.session().token;
    for (const text of ['', '  ', 'x'.repeat(501), {}, null]) {
        assert.throws(() => registry.chat(token, 'send', text), { status: 400 });
    }
    registry.chat(token, 'send', ' 첫 인사 ');
    assert.equal(registry.chat(token, 'list').messages[0].text, '첫 인사');
    assert.throws(() => registry.chat(token, 'send', '빠른 연속 메시지'), { status: 429 });
    assert.throws(() => registry.chat(token, 'delete'), { status: 400 });
    for (let i = 0; i < 105; i++) {
        now += 1000;
        registry.update(token, 'heartbeat');
        registry.chat(token, 'send', `${i}`);
    }
    assert.equal(registry.messages.length, 100);
    now += 30000;
    assert.throws(() => registry.chat(token, 'list'), { status: 401 });
});
