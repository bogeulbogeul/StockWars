import { toastManager } from './ToastManager.js';
import { FriendGifts } from './FriendGifts.js';

export class PlayerSocial {
    constructor(app) {
        this.app = app;
        this.giftDelivery = new FriendGifts(app);
        if (window.stockWarsChat?.friends) app.smartphoneUI.bubbleAppModule.callbacks.addOnlineFriend = name => this.addByName(name);
        this.state = { friends: [], incoming: [], outgoing: [] };
        this.knownRequests = new Set();
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'settings-dialog';
        this.dialog.setAttribute('aria-label', '마을 플레이어 프로필');
        this.dialog.addEventListener('keydown', e => e.stopPropagation());
        app.appContainer.append(this.dialog);
        this.panel = document.createElement('section');
        this.panel.className = 'player-social-panel';
        app.smartphoneUI.bubbleAppModule.ktFriendsContainer?.before(this.panel);
        if (window.stockWarsChat?.friends && app.smartphoneUI.bubbleAppModule.ktFriendsContainer) app.smartphoneUI.bubbleAppModule.ktFriendsContainer.hidden = true;
        void this.refresh();
        this.timer = setInterval(() => this.refresh(), 5000);
    }
    async refresh() {
        if (!window.stockWarsChat?.friends || this.refreshing) return;
        this.refreshing = true;
        try {
            if (this.app.itemEngine?.state.pendingGift) await this.giftDelivery.retry();
            const result = await window.stockWarsChat.friends('list');
            if (result.error) return;
            this.state = result;
            await this.giftDelivery.receive(result.gifts);
            for (const request of result.incoming) {
                const key = `${request.id}:${request.name}`;
                if (!this.knownRequests.has(key)) toastManager.show(`${request.name}님이 친구 요청을 보냈습니다. 버블의 친구 화면에서 확인하세요.`);
            }
            this.knownRequests = new Set(result.incoming.map(r => `${r.id}:${r.name}`));
            this.renderPanel();
        } finally { this.refreshing = false; }
    }
    button(label, handler) {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = label;
        button.addEventListener('click', async () => {
            button.disabled = true;
            try { await handler(); } catch (error) { toastManager.show(error.message || '요청을 처리하지 못했습니다. 다시 시도해 주세요.', false); } finally { button.disabled = false; }
        });
        return button;
    }
    async addByName(name) {
        const found = await window.stockWarsChat.friends('search', undefined, { query: name });
        if (found.error) return { success: false, message: found.error };
        const player = found.players?.[0];
        if (!player) return { success: false, message: '해당 닉네임의 플레이어를 찾을 수 없습니다.' };
        const result = await window.stockWarsChat.friends('request', player.id, { targetName: player.name });
        if (result.error) return { success: false, message: result.error };
        this.state = result; this.renderPanel();
        return { success: true, message: `${player.name}님에게 친구 요청을 보냈습니다. 수락하면 친구 목록에 표시됩니다.` };
    }
    async command(operation, player) {
        if (operation === 'gift') { this.giftDelivery.open(player); return; }
        const result = await window.stockWarsChat?.friends(operation, player.id, { targetName: player.name || player.nickname });
        if (!result || result.error) { toastManager.show(result?.error || '서버 연결이 필요합니다.', false); return; }
        if (operation === 'chat') {
            this.dialog.close();
            const phone = this.app.smartphoneUI;
            phone.showPhone(); phone.showBubbleApp();
            const roomState = await window.stockWarsChat.room('list', { roomId: result.roomId });
            if (roomState.error) { toastManager.show(roomState.error, false); return; }
            phone.bubbleAppModule.currentRoomId = result.roomId;
            phone.bubbleAppModule.applyPlayerChat(roomState);
            phone.bubbleAppModule.openChatRoom(result.roomId);
            phone.bubbleAppModule.dom.bubbleMsgInput?.focus();
        } else {
            this.state = result;
            await this.giftDelivery.receive(result.gifts);
            this.renderPanel();
            if (this.dialog.open && this.player) this.renderCard();
            toastManager.show(operation === 'request' ? '친구 요청을 보냈습니다.' : operation === 'accept' ? '친구가 되었습니다!' : '친구 요청을 처리했습니다.');
        }
    }
    renderPanel() {
        this.panel.replaceChildren();
        const giftLimit = document.createElement('p'); giftLimit.textContent = `오늘 선물 ${this.state.giftsRemaining ?? 3}/3개 남음 · 찌라시 포함`; this.panel.append(giftLimit);
        for (const [key, heading] of [['incoming', '받은 요청'], ['outgoing', '보낸 요청'], ['friends', '마을 친구']]) {
            const title = document.createElement('h3'); title.textContent = `${heading} · ${this.state[key].length}`;
            this.panel.append(title);
            for (const player of this.state[key]) {
                const row = document.createElement('div'); row.className = 'player-social-row';
                const name = document.createElement('span'); name.textContent = player.name;
                row.append(name);
                if (player.id || key !== 'friends') {
                    const actions = key === 'incoming' ? [['수락', 'accept'], ['거절', 'reject']] : key === 'outgoing' ? [['요청 취소', 'cancel']] : [['대화하기', 'chat'], ['선물하기', 'gift']];
                    for (const [label, action] of actions) row.append(this.button(label, () => this.command(action, player)));
                } else { if (key === 'friends') row.append(this.button('선물하기', () => this.command('gift', player))); const note = document.createElement('small'); note.textContent = '상대 재접속 대기'; row.append(note); }
                this.panel.append(row);
            }
        }
    }
    async open(player) {
        this.player = player;
        await this.refresh();
        this.renderCard();
        if (!this.dialog.open) this.dialog.showModal();
    }
    renderCard() {
        const player = this.player;
        this.dialog.replaceChildren();
        const title = document.createElement('h2'); title.textContent = player.nickname || player.name || '플레이어';
        const detail = document.createElement('p'); detail.textContent = `Lv. ${player.level || 1} · ${player.trait || '성향 미등록'} · ID ${player.id}`;
        this.dialog.append(title, detail);
        if (this.state.friends.some(p => p.id === player.id)) this.dialog.append(this.button('대화하기', () => this.command('chat', player)), this.button('선물하기', () => this.command('gift', player)));
        else if (this.state.incoming.some(p => p.id === player.id)) {
            this.dialog.append(this.button('친구 요청 수락', () => this.command('accept', player)), this.button('거절', () => this.command('reject', player)));
        } else if (this.state.outgoing.some(p => p.id === player.id)) this.dialog.append(this.button('요청 중 · 취소', () => this.command('cancel', player)));
        else this.dialog.append(this.button('친구 요청', () => this.command('request', player)));
        this.dialog.append(this.button('닫기', () => this.dialog.close()));
    }
}
