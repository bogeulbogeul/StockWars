import test from 'node:test';
import assert from 'node:assert/strict';
import { DeveloperFriend, DEVELOPER_FRIEND_ID } from '../js/engine/DeveloperFriend.js';

test('developer friend supports outgoing, incoming, accept, cancel and clean reset', () => {
    const friend = new DeveloperFriend();
    assert.equal(friend.player.id, DEVELOPER_FRIEND_ID);
    assert.equal(friend.snapshot().friends.length, 0);
    assert.equal(friend.command('request').outgoing.length, 1);
    assert.equal(friend.command('simulateAccept').friends.length, 1);
    assert.equal(friend.command('simulateGift').gifts.length, 1);
    assert.equal(friend.gifts[0].preview, true);
    friend.reset();
    assert.equal(friend.gifts.length, 0);
    assert.equal(friend.command('simulateAccept').success, false);
    assert.equal(friend.command('simulateIncoming').incoming.length, 1);
    assert.equal(friend.command('reject').incoming.length, 0);
    friend.command('simulateIncoming');
    assert.equal(friend.command('accept').friends.length, 1);
    friend.reset();friend.command('request');
    assert.equal(friend.command('cancel').outgoing.length, 0);
});
test('test chat requires friendship, validates messages and never uses server or inventory', () => {
    const friend = new DeveloperFriend();
    assert.equal(friend.send('안녕'), false);
    friend.command('simulateIncoming');friend.command('accept');
    assert.equal(friend.send(' '), false);
    assert.equal(friend.send('x'.repeat(501)), false);
    assert.equal(friend.send('<img src=x>'), true);
    assert.equal(friend.messages[0].text, '<img src=x>');
    assert.equal(friend.messages[1].own, false);
    for(let i=0;i<30;i++)friend.send('테스트');
    assert.equal(friend.messages.length,40);
    friend.reset();assert.equal(friend.messages.length,0);
});
