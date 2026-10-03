import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/components/smartphone/BubbleApp.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export class BubbleApp', 'globalThis.BubbleApp = class BubbleApp');

function fixture(bridge) {
    const notices = [];
    const context = vm.createContext({ document: { getElementById: () => null }, window: { stockWarsChat: bridge }, toastManager: { show: (...args) => notices.push(args) } });
    vm.runInContext(source, context);
    const app = Object.create(context.BubbleApp.prototype);
    Object.assign(app, { currentRoomId: 'players', activeSubTab: 'chats', playerMessages: [], playerChatStatus: '',
        chatRooms: [{ id: 'players', unread: 0 }], updateBadges() {},
        dom: { bubbleApp: { classList: { contains: () => false } }, bubbleMsgInput: { value: '안녕하세요' },
            btnBubbleSend: { disabled: false }, bubbleChatFeed: { dataset: {}, scrollHeight: 100, clientHeight: 100, scrollTop: 0 } } });
    return { app, notices };
}

test('incoming messages escape HTML, own messages render outgoing, read state clears', () => {
    const { app } = fixture();
    app.applyPlayerChat({ playerId: 1, messages: [
        { id: 1, playerId: 2, sender: '<img src=x>', text: '<script>alert(1)</script>', timestamp: 1 },
        { id: 2, playerId: 1, sender: '나', text: '반갑습니다', timestamp: 2 }
    ] });
    assert.match(app.dom.bubbleChatFeed.innerHTML, /&lt;script&gt;/);
    assert.match(app.dom.bubbleChatFeed.innerHTML, /&lt;img src=x&gt;/);
    assert.match(app.dom.bubbleChatFeed.innerHTML, /chat-row outgoing/);
    assert.equal(app.chatRooms[0].unread, 0);
});

test('failed sends preserve draft and successful sends clear it without automatic replies', async () => {
    const { app, notices } = fixture({ send: async () => ({ error: '연결 끊김' }) });
    await app.handleSendBubbleMessage();
    assert.equal(app.dom.bubbleMsgInput.value, '안녕하세요');
    assert.equal(app.dom.btnBubbleSend.disabled, false);
    assert.equal(notices[0][0], '연결 끊김');
    const successful = fixture({ send: async text => ({ playerId: 1, messages: [{ id: 1, playerId: 1, sender: '플레이어 1', text, timestamp: 1 }] }) }).app;
    await successful.handleSendBubbleMessage();
    assert.equal(successful.dom.bubbleMsgInput.value, '');
    assert.equal(successful.playerMessages.length, 1);
    assert.equal(successful.playerMessages[0].reply, undefined);
});

test('polling reports unavailable bridge and preserves scroll while reading old messages', async () => {
    const { app } = fixture();
    await app.refreshPlayerChat();
    assert.match(app.dom.bubbleChatFeed.innerHTML, /데스크톱 앱/);
    Object.assign(app.dom.bubbleChatFeed, { scrollHeight: 1000, clientHeight: 100, scrollTop: 120 });
    app.renderPlayerMessages();
    assert.equal(app.dom.bubbleChatFeed.scrollTop, 120);
});

test('friend direct chat opens, focuses input and sends the typed message', async () => {
    const { app } = fixture();
    let focused = false;
    app.bubbleUserMessages = {};
    app.dom.bubbleMsgInput.focus = () => { focused = true; };
    app.dom.bubbleChatFeed.querySelectorAll = () => [];
    app.openDirectMessageWithFriend({ id: 'friend_1', name: '골든차트_김팀장', title: '테스트 인물' });
    assert.equal(app.currentRoomId, 'friend_1');
    assert.equal(focused, true);
    await app.handleSendBubbleMessage();
    assert.equal(app.dom.bubbleMsgInput.value, '');
    assert.match(app.dom.bubbleChatFeed.innerHTML, /chat-row outgoing/);
    assert.equal(app.bubbleUserMessages.friend_1.at(-1).text, '안녕하세요');
    app.openDirectMessageWithFriend({ id: 'friend_1', name: '골든차트_김팀장', title: '테스트 인물' });
    assert.equal(app.chatRooms.filter(room => room.id === 'friend_1').length, 1);
    assert.equal(app.bubbleUserMessages.friend_1.length, 2);
});

test('promotional NPC rooms reject sending while friend rooms remain writable', async () => {
    const { app } = fixture();
    app.chatRooms.push({ id: 'vivian', readOnly: true });
    app.currentRoomId = 'vivian';
    app.bubbleUserMessages = { vivian: [] };
    await app.handleSendBubbleMessage();
    assert.equal(app.bubbleUserMessages.vivian.length, 0);
    assert.equal(app.dom.bubbleMsgInput.value, '안녕하세요');
    app.setEmoticonPanelOpen(true);
    assert.equal(app.emoticonPanelOpen, false);
});
