import { createGeometricAvatarSVG } from './GeometricAvatar.js';
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
        this.dialog.className = 'settings-dialog player-social-card';
        this.dialog.setAttribute('aria-label', '마을 플레이어 프로필');
        this.dialog.addEventListener('keydown', e => e.stopPropagation());
        app.appContainer.append(this.dialog);
        this.encounterHint = document.createElement('aside');
        this.encounterHint.className = 'town-friend-tutorial';
        this.encounterHint.hidden = true;
        this.encounterHint.setAttribute('aria-label', '친구 추가 튜토리얼');
        this.encounterHint.setAttribute('aria-live', 'polite');
        app.appContainer.append(this.encounterHint);
        this.dialog.addEventListener('close', () => { this.tutorialOpen = false; });
        this.panel = document.createElement('section');
        this.panel.className = 'player-social-panel';
        this.giftPanel = document.createElement('section');
        this.giftPanel.className = 'social-gift-panel';
        this.giftPanel.setAttribute('aria-label', '선물함');
        app.smartphoneUI.bubbleAppModule.ktFriendsContainer?.before(this.giftPanel, this.panel);
        if (window.stockWarsChat?.friends && app.smartphoneUI.bubbleAppModule.ktFriendsContainer) app.smartphoneUI.bubbleAppModule.ktFriendsContainer.hidden = true;
        void this.refresh();
        this.timer = setInterval(() => this.refresh(), 5000);
    }
    async refresh() {
        if (this.app.isLocalSession || !window.stockWarsChat?.friends) {
            this.state = { friends: [], incoming: [], outgoing: [] };
            this.giftDelivery.pending = [];
            this.renderPanel();
            return;
        }
        if (!window.stockWarsChat?.friends || this.refreshing) return;
        this.refreshing = true;
        try {
            if (this.app.itemEngine?.state.pendingGift) await this.giftDelivery.retry();
            const result = await window.stockWarsChat.friends('list');
            if (result.error) return;
            const relationship = state => JSON.stringify(['friends', 'incoming', 'outgoing'].map(key => state[key].some(p => p.id === this.player?.id)));
            const previousRelationship = relationship(this.state);
            this.state = result;
            await this.giftDelivery.receive(result.gifts);
            for (const request of result.incoming) {
                const key = `${request.id}:${request.name}`;
                if (!this.knownRequests.has(key)) toastManager.show(`${request.name}님이 친구 요청을 보냈습니다. 버블의 친구 화면에서 확인하세요.`);
            }
            this.knownRequests = new Set(result.incoming.map(r => `${r.id}:${r.name}`));
            this.renderPanel();
            if (this.dialog.open && this.player && relationship(this.state) !== previousRelationship) this.renderCard();
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
    encounter(player) {
        if (!player || this.app.annaTutorial?.isActive || (this.app.itemEngine?.state.townFriendTutorialSeen && (this.encounterHint.hidden || this.encounterPlayer?.id !== player.id)) || this.dialog.open || this.state.friends.some(p => p.id === player.id)) {
            this.encounterHint.hidden = true;
            return;
        }
        if (this.encounterHint.hidden || this.encounterPlayer?.id !== player.id) {
            this.encounterPlayer = player;
            this.encounterHint.replaceChildren();
            const label = document.createElement('small'); label.textContent = 'ANNA · 마을에서 친구 만나기';
            const title = document.createElement('h3'); title.textContent = `${player.nickname || player.name || '트레이더'}님을 만났어요!`;
            const text = document.createElement('p'); text.textContent = '마을에 있는 다른 유저의 캐릭터를 클릭하면 프로필을 볼 수 있어요. 프로필에서 친구 요청을 보내고, 상대가 수락하면 버블에서 대화와 선물을 주고받을 수 있어요.';
            const actions = document.createElement('div'); actions.className = 'social-card-actions';
            actions.append(this.button('프로필 보기 →', () => { this.finishTutorial(); void this.open(this.encounterPlayer); }), this.button('나중에 볼게요', () => this.finishTutorial()));
            this.encounterHint.append(label, title, text, actions);
            if (this.app.itemEngine) this.app.itemEngine.state.townFriendTutorialSeen = true;
            this.app.itemGameplay?.save();
        }
        this.encounterHint.hidden = false;
    }
    finishTutorial() {
        if (this.app.itemEngine) this.app.itemEngine.state.townFriendTutorialSeen = true;
        this.encounterHint.hidden = true;
        this.app.itemGameplay?.save();
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
            if (operation === 'request' || operation === 'accept') this.finishTutorial();
            await this.giftDelivery.receive(result.gifts);
            this.renderPanel();
            if (this.dialog.open && this.player) this.renderCard();
            toastManager.show(operation === 'request' ? '친구 요청을 보냈습니다.' : operation === 'accept' ? '친구가 되었습니다!' : '친구 요청을 처리했습니다.');
        }
    }
    renderPanel() {
        this.panel.replaceChildren();
        const inbox = this.button(`🎁 선물함 · ${this.giftDelivery.pending.length}`, () => this.giftDelivery.openInbox());
        inbox.className = 'social-inbox-button';
        this.giftPanel.replaceChildren();
        const giftTitle = document.createElement('h3'); giftTitle.textContent = '받은 선물';
        this.giftPanel.append(giftTitle, inbox);
        const giftLimit = document.createElement('p'); giftLimit.textContent = `오늘 선물 ${this.state.giftsRemaining ?? 3}/3개 남음 · 찌라시 포함`; this.giftPanel.append(giftLimit);
        for (const [key, heading] of [['incoming', '받은 요청'], ['outgoing', '보낸 요청'], ['friends', '마을 친구']]) {
            const title = document.createElement('h3'); title.textContent = `${heading} · ${this.state[key].length}`;
            this.panel.append(title);
            if (!this.state[key].length) {
                const empty = document.createElement('p'); empty.className = 'social-empty';
                empty.textContent = key === 'friends' ? '마을에서 만난 트레이더에게 친구 요청을 보내보세요.' : key === 'incoming' ? '받은 친구 요청이 없어요.' : '수락을 기다리는 요청이 없어요.';
                this.panel.append(empty);
            }
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
        if (!player?.id) return;
        this.player = player;
        this.tutorialOpen = !this.app.itemEngine?.state.townFriendTutorialSeen;
        this.encounterHint.hidden = true;
        await this.refresh();
        this.renderCard();
        if (!this.dialog.open) this.dialog.showModal();
    }
    renderCard() {
        const player = this.player;
        this.dialog.replaceChildren();
        const label = document.createElement('small'); label.className = 'social-eyebrow'; label.textContent = 'CIPHER NETWORK · TRADER PROFILE';
        const avatar = document.createElement('div'); avatar.className = 'social-avatar'; avatar.innerHTML = createGeometricAvatarSVG({ direction: 'front' });
        avatar.querySelector('svg').setAttribute('viewBox', '28 24 144 140');
        avatar.querySelector('svg').setAttribute('focusable', 'false');
        avatar.setAttribute('aria-hidden', 'true');
        const title = document.createElement('h2'); title.textContent = player.nickname || player.name || '플레이어';
        const detail = document.createElement('p'); detail.className = 'social-player-detail'; detail.textContent = `Lv. ${player.level || 1} · ${player.trait || '성향 미등록'}`;
        this.dialog.append(label, avatar, title, detail);
        const friends = this.state.friends.some(p => p.id === player.id);
        const incoming = this.state.incoming.some(p => p.id === player.id);
        const outgoing = this.state.outgoing.some(p => p.id === player.id);
        const badge = document.createElement('span'); badge.className = 'social-status-badge'; badge.textContent = friends ? '✓ 연결된 친구' : incoming ? '받은 친구 요청' : outgoing ? '수락을 기다리는 중' : '마을에서 만난 트레이더';
        this.dialog.append(badge);
        const guide = document.createElement('section'); guide.className = 'social-friend-guide';
        const heading = document.createElement('h3'); heading.textContent = outgoing ? '요청을 보냈어요!' : friends ? '이제 버블에서 만나요' : '안나의 친구 추가 가이드';
        const steps = document.createElement('ol');
        for (const text of ['프로필에서 상대 닉네임 확인', '친구 요청 보내기 · 받은 요청은 수락하기', '상대가 수락하면 버블 → 친구에서 대화·선물']) { const item = document.createElement('li'); item.textContent = text; steps.append(item); }
        const note = document.createElement('p'); note.textContent = outgoing ? '상대가 수락하기 전에는 친구가 아니에요. 버블의 보낸 요청에서 상태를 확인할 수 있어요.' : friends ? '아래 대화하기를 누르면 버블의 대화방으로 이동해요.' : '친구 요청은 아래 버튼을 눌러 직접 보내요. 상대가 수락하면 친구 목록에 나타나요.';
        guide.append(heading, steps, note);
        if (this.tutorialOpen || outgoing) this.dialog.append(guide);
        else { const help = document.createElement('details'); help.className = 'social-friend-guide'; const summary = document.createElement('summary'); summary.textContent = '친구 추가 방법 다시 보기'; help.append(summary, steps, note); this.dialog.append(help); }
        const actions = document.createElement('div'); actions.className = 'social-card-actions';
        this.dialog.append(actions);
        if (friends) actions.append(this.button('대화하기', () => this.command('chat', player)), this.button('선물하기', () => this.command('gift', player)));
        else if (this.state.incoming.some(p => p.id === player.id)) {
            actions.append(this.button('친구 요청 수락', () => this.command('accept', player)), this.button('거절', () => this.command('reject', player)));
        } else if (outgoing) actions.append(this.button('친구 요청 취소', () => this.command('cancel', player)));
        else actions.append(this.button('친구 요청 보내기', () => this.command('request', player)));
        const close = this.button('닫기', () => this.dialog.close()); close.className = 'social-close'; this.dialog.append(close);
    }
}
