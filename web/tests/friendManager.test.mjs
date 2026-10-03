import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/engine/FriendManager.js', import.meta.url), 'utf8')
    .replace('export class FriendManager', 'globalThis.FriendManager = class FriendManager')
    .replace('export const friendManager', 'const friendManager');
const context = vm.createContext({});
vm.runInContext(source, context);
const FriendManager = context.FriendManager;

test('one test friend and added friends persist including friendship progress', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
    const first = new FriendManager({ storage });
    assert.equal(first.getFriends().length, 0);
    assert.equal(first.addFriendByName(' 실제친구 ').success, true);
    const added = first.getFriends()[0];
    assert.equal(added.name, '실제친구');
    assert.equal(added.netWorth, 0);
    assert.equal(added.isOnline, false);
    first.sendEnergyGift(added.id);
    const reopened = new FriendManager({ storage });
    assert.equal(reopened.getFriends().length, 1);
    assert.equal(reopened.getFriend(added.id).fp, 10);
    assert.equal(reopened.sendEnergyGift(added.id).success, false);
    assert.equal(reopened.addFriendByName('실제친구').success, false);
    assert.equal(reopened.envyNotifications.length, 0);
});

test('invalid input and corrupt storage do not break the friend list', () => {
    const manager = new FriendManager({ storage: { getItem: () => '{invalid', setItem() { throw new Error('full'); } } });
    for (const name of [undefined, null, '', '  ', 'a'.repeat(41)]) assert.equal(manager.addFriendByName(name).success, false);
    assert.equal(manager.addFriendByName('새친구').success, true);
    assert.equal(manager.getFriends().length, 1);
});
