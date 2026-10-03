/**
 * BubbleApp Component (카카오톡 스타일 모바일 메신저 + 친구 & 소셜 루프)
 * Features Open Chat Rooms, 1:1 Direct Messages, Friend List, FP Progress, and Envy Feed.
 */
import { friendManager } from '../../engine/FriendManager.js';
import { toastManager } from '../ToastManager.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export class BubbleApp {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.activeFilter = 'all';
        this.activeSubTab = 'chats';
        this.currentRoomId = null;
        this.latestState = null;
        this.readRumorIds = new Set();
        this.chatRooms = [{ id: 'players', hidden: true, type: 'open', title: '플레이어 라운지', sub: '플레이어 전체 채팅', avatar: '💬', lastMsg: '', time: '', unread: 0 }];
        this.bubbleUserMessages = { rumor: [], anna: [], quant: [], vivian: [] };
        this.restoreLocalRooms();

        this.initDOM();
        this.initEventListeners();
        this.showChatList();
        this.playerMessages = [];
        this.playerChatStatus = '연결 확인 중';
        this.playerChatReady = false;
        this.playerChatTimer = setInterval(() => {
            if (this.dom.bubbleApp && !this.dom.bubbleApp.classList.contains('hidden')) void this.refreshPlayerChat();
            if (this.dom.bubbleApp && !this.dom.bubbleApp.classList.contains('hidden')) void this.refreshFriendNews();
        }, 2500);
        void this.refreshPlayerChat();
    }

    initDOM() {
        this.bubbleNavBar = document.getElementById('bubbleNavBar');
        this.navTabs = document.querySelectorAll('.bubble-nav-tab');
        this.subViews = {
            chats: document.getElementById('bubbleSubViewChats'),
            friends: document.getElementById('bubbleSubViewFriends'),
            add: document.getElementById('bubbleSubViewAdd'),
            envy: document.getElementById('bubbleSubViewEnvy')
        };
        this.ktFriendsContainer = document.getElementById('ktFriendsContainer');
        this.ktRecommendedContainer = document.getElementById('ktRecommendedContainer');
        this.ktEnvyFeedContainer = document.getElementById('ktEnvyFeedContainer');
        this.inputKtFriendSearch = document.getElementById('inputKtFriendSearch');
        this.btnKtAddFriendSubmit = document.getElementById('btnKtAddFriendSubmit');
    }

    initEventListeners() {
        document.getElementById('btnBubbleInviteFriends')?.addEventListener('click', () => this.openRoomInvite());
        document.getElementById('btnBubbleCreateRoom')?.addEventListener('click', () => this.showRoomCreator());
        document.getElementById('btnBubbleCreateCancel')?.addEventListener('click', () => this.closeRoomCreator());
        document.getElementById('btnBubbleCreateSubmit')?.addEventListener('click', () => this.createPlayerRoom());
        document.getElementById('btnBubbleAddFriend')?.addEventListener('click', () => {
            this.switchSubView('add');
            this.inputKtFriendSearch?.focus();
        });
        document.getElementById('btnBubbleAddBack')?.addEventListener('click', () => this.switchSubView('friends'));
        this.dom.btnBubbleBack?.addEventListener('click', () => this.callbacks.onShowHomeScreen?.());
        this.dom.btnKtRoomBack?.addEventListener('click', () => this.showChatList());

        this.navTabs.forEach(btn => {
            btn.addEventListener('click', () => this.switchSubView(btn.dataset.tab));
        });

        if (this.dom.ktFilterBar) {
            this.dom.ktFilterBar.querySelectorAll('.kt-filter-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.ktFilterBar.querySelectorAll('.kt-filter-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeFilter = btn.dataset.filter;
                    this.renderChatList();
                });
            });
        }

        this.dom.btnBubbleSend?.addEventListener('click', () => this.handleSendBubbleMessage());
        this.dom.bubbleMsgInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) this.handleSendBubbleMessage();
        });

        document.getElementById('btnKtEmoticon')?.addEventListener('click', () => {
            this.setEmoticonPanelOpen(!this.emoticonPanelOpen);
        });
        document.getElementById('btnBubbleEmoticonClose')?.addEventListener('click', () => this.setEmoticonPanelOpen(false));
        this.dom.bubbleMsgInput?.addEventListener('focus', () => this.setEmoticonPanelOpen(false));
        this.dom.kakaotalkRoomView?.addEventListener('keydown', event => {
            if (event.key === 'Escape' && this.emoticonPanelOpen) {
                event.stopPropagation();
                this.setEmoticonPanelOpen(false);
                document.getElementById('btnKtEmoticon')?.focus();
            }
        });

        this.dom.btnBubbleRefresh?.addEventListener('click', () => {
            if (this.currentRoomId === 'players') { void this.refreshPlayerChat(); return; }
            if (this.currentRoomId) this.renderMessages(this.currentRoomId);
            else this.renderActiveSubView();
        });

        this.btnKtAddFriendSubmit?.addEventListener('click', () => {
            const val = this.inputKtFriendSearch?.value;
            const res = friendManager.addFriendByName(val);
            toastManager.show(res.message, res.success);
            if (res.success && this.inputKtFriendSearch) {
                this.inputKtFriendSearch.value = '';
                this.switchSubView('friends');
            }
        });
        this.inputKtFriendSearch?.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                this.btnKtAddFriendSubmit?.click();
            }
        });
    }

    switchSubView(tabName) {
        this.activeSubTab = tabName;
        this.navTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === (tabName === 'add' ? 'friends' : tabName)));
        const title = document.getElementById('ktHeaderTitle');
        if (title) title.textContent = { chats: '채팅', friends: '친구', add: '친구 추가', envy: '친구 소식' }[tabName] || 'Bubble';
        if (tabName === 'envy') {
            const intro = document.getElementById('bubbleNewsIntro');
            try {
                if (intro) intro.hidden = localStorage.getItem('stockwars.bubble.newsIntroSeen') === '1';
                localStorage.setItem('stockwars.bubble.newsIntroSeen', '1');
            } catch { if (intro) intro.hidden = !!this.newsIntroSeen; }
            this.newsIntroSeen = true;
            this.seenNewsIds = new Set(friendManager.envyNotifications.map(item => item.id));
        }
        Object.keys(this.subViews).forEach(key => {
            if (this.subViews[key]) {
                this.subViews[key].classList.toggle('hidden', key !== tabName);
                this.subViews[key].classList.toggle('active', key === tabName);
            }
        });
        this.renderActiveSubView();
    }

    renderActiveSubView() {
        if (this.activeSubTab === 'chats') this.renderChatList();
        else if (this.activeSubTab === 'friends') this.renderFriendsView();
        else if (this.activeSubTab === 'add') this.renderAddView();
        else if (this.activeSubTab === 'envy') this.renderEnvyView();
    }

    updateState(state) {
        this.latestState = state;
        const rawRumors = (state.news || []).filter(n => n.type === '찌라시');
        
        if (this.currentRoomId === 'rumor') {
            rawRumors.forEach(r => this.readRumorIds.add(r.id || r.title || r.content));
        }

        const unreadRumors = rawRumors.filter(r => !this.readRumorIds.has(r.id || r.title || r.content));
        const rumorRoom = this.chatRooms.find(r => r.id === 'rumor');
        if (rumorRoom) {
            if (rawRumors.length > 0) {
                rumorRoom.lastMsg = rawRumors[rawRumors.length - 1].content || '새로운 시장 찌라시 수신';
            }
            rumorRoom.unread = unreadRumors.length;
        }

        this.updateBadges();

        if (this.dom.bubbleApp && !this.dom.bubbleApp.classList.contains('hidden')) {
            if (this.currentRoomId) this.renderMessages(this.currentRoomId);
            else this.renderActiveSubView();
        }
    }

    updateBadges() {
        const newsDot = document.getElementById('bubbleNewsDot');
        if (newsDot) newsDot.hidden = !friendManager.envyNotifications.some(item => !this.seenNewsIds?.has(item.id));
        const totalUnread = this.chatRooms.reduce((acc, r) => acc + (r.unread || 0), 0);
        if (this.dom.badgeRumorCount) {
            this.dom.badgeRumorCount.textContent = totalUnread;
            this.dom.badgeRumorCount.style.display = totalUnread > 0 ? 'inline-block' : 'none';
        }
        if (this.dom.bubbleBadgeHome) {
            this.dom.bubbleBadgeHome.textContent = totalUnread;
            this.dom.bubbleBadgeHome.style.display = totalUnread > 0 ? 'flex' : 'none';
        }
    }

    showChatList() {
        this.setEmoticonPanelOpen(false);
        this.currentRoomId = null;
        this.bubbleNavBar?.classList.remove('hidden');
        this.dom.kakaotalkListView?.classList.remove('hidden');
        this.dom.kakaotalkRoomView?.classList.add('hidden');
        this.renderActiveSubView();
    }

    renderChatList() {
        if (!this.dom.ktRoomList) return;
        const filtered = this.chatRooms.filter(room => {
            if (room.hidden) return false;
            if (room.hidden) return false;
            if (this.activeFilter === 'open') return room.type === 'open';
            if (this.activeFilter === 'direct') return room.type === 'direct';
            return true;
        });

        this.dom.ktRoomList.innerHTML = filtered.map(room => `
            <div class="kt-room-item" data-id="${room.id}">
                <div class="kt-room-avatar">${room.avatar}</div>
                <div class="kt-room-content">
                    <div class="kt-room-top-row">
                        <span class="kt-room-name">${escapeHtml(room.title)}</span>
                        <span class="kt-room-badge ${room.type}">${escapeHtml(room.sub)}</span>
                    </div>
                    <div class="kt-room-last-msg">${escapeHtml(room.lastMsg)}</div>
                </div>
                <div class="kt-room-meta">
                    <span class="kt-room-time">${room.time}</span>
                    ${room.unread > 0 ? `<span class="kt-unread-pill">${room.unread}</span>` : ''}
                </div>
            </div>
        `).join('');

        this.dom.ktRoomList.querySelectorAll('.kt-room-item').forEach(item => {
            item.addEventListener('click', () => this.openChatRoom(item.dataset.id));
        });
        if (!filtered.length) this.dom.ktRoomList.innerHTML = '<div class="empty-state">아직 채팅방이 없습니다. 새 방을 만들어보세요.</div>';
        if (!filtered.length) this.dom.ktRoomList.innerHTML = '<div class="empty-state">아직 채팅방이 없습니다. 새 방을 만들어보세요.</div>';
    }

    renderFriendsView() {
        if (!this.ktFriendsContainer) return;
        const friends = friendManager.getFriends();
        if (friends.length === 0) {
            this.ktFriendsContainer.innerHTML = `<div class="empty-state">등록된 친구가 없습니다.</div>`;
            return;
        }

        this.ktFriendsContainer.innerHTML = friends.map(f => {
            const lvl = f.levelInfo;
            const fpPercent = Math.min(100, Math.floor((f.fp / lvl.maxFp) * 100));
            return `<div class="friend-card">
                <div class="friend-card-top">
                    <div class="friend-avatar">${f.avatar}</div>
                    <div class="friend-info">
                        <div class="friend-name-row"><span class="friend-name">${escapeHtml(f.name)}</span><span class="friend-badge">${lvl.badge} ${lvl.name}</span></div>
                        <div class="friend-sub-info">${f.isTest ? '테스트용 인물' : escapeHtml(f.title)}${f.isTest ? ` | 자산 ${f.netWorth.toLocaleString()}G` : ''}</div>
                    </div>
                </div>
                <div class="fp-progress-box">
                    <div class="fp-label-row"><span>우호도 (FP): ${f.fp}/${lvl.maxFp}</span><span class="fp-benefit-tag">${lvl.desc}</span></div>
                    <div class="fp-bar-bg"><div class="fp-bar-fill" style="width: ${fpPercent}%;"></div></div>
                </div>
                <div class="friend-actions">
                    <button class="btn-action gift" data-id="${f.id}">⚡ 선물</button>
                    <button class="btn-action rumor" data-id="${f.id}">📰 찌라시</button>
                    <button class="btn-action dm" data-id="${f.id}">💬 1:1 대화</button>
                </div>
            </div>`;
        }).join('');

        this.ktFriendsContainer.querySelectorAll('.btn-action.gift').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openInventoryShare(btn.dataset.id, 'gift');
            });
        });
        this.ktFriendsContainer.querySelectorAll('.btn-action.rumor').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openInventoryShare(btn.dataset.id, 'rumor');
            });
        });
        this.ktFriendsContainer.querySelectorAll('.btn-action.dm').forEach(btn => {
            btn.addEventListener('click', () => {
                const friend = friendManager.getFriend(btn.dataset.id);
                if (friend) this.openDirectMessageWithFriend(friend);
            });
        });
    }

    renderAddView() {
        if (!this.ktRecommendedContainer) return;
        this.ktRecommendedContainer.innerHTML = '<p class="bubble-add-hint">추가한 친구는 친구 목록에서 확인할 수 있어요.</p>';
    }

    renderEnvyView() {
        if (!this.ktEnvyFeedContainer) return;
        const feed = friendManager.envyNotifications;
        if (feed.length === 0) {
            this.ktEnvyFeedContainer.innerHTML = `<div class="empty-state">아직 친구 소식이 없습니다.</div>`;
            return;
        }

        this.updateBadges();
        this.ktEnvyFeedContainer.innerHTML = feed.map(item => `
            <div class="envy-feed-card ${item.reacted ? 'reacted' : ''}">
                <div class="envy-feed-top">
                    <span class="bubble-news-avatar">${escapeHtml(friendManager.getFriend(item.friendId)?.avatar || '👤')}</span>
                    <div class="bubble-news-profile"><strong>${escapeHtml(item.friendName)}</strong><span>${escapeHtml(item.timestamp)}</span></div>
                </div>
                <div class="bubble-news-achievement">${escapeHtml(item.icon)} ${escapeHtml(item.trigger)}</div>
                <div class="envy-msg">${escapeHtml(item.message)}</div>
                ${item.comment ? `<div class="bubble-news-comment">“${escapeHtml(item.comment)}”</div>` : ''}
                ${item.serverPost ? `<small class="bubble-news-achievement">반응 ${item.reactionCount || 0}개</small>` : ''}
                <div class="envy-reactions">
                    ${item.isOwn ? '<span class="bubble-add-hint">내가 게시한 소식</span>' : [['congratulate', 'congrats', '🥳 축하'], ['jealous', 'jealous', '😒 질투'], ['hate', 'hate', '😡 분노']].map(([type, cls, label]) => `<button class="btn-envy react-${cls} ${item.reactionType === type ? 'selected' : ''}" data-id="${escapeHtml(item.id)}" aria-pressed="${item.reactionType === type}" ${item.reacted ? 'disabled' : ''}>${label}</button>`).join('')}
                </div>
            </div>`).join('');

        this.ktEnvyFeedContainer.querySelectorAll('.btn-envy').forEach(btn => {
            btn.addEventListener('click', async () => {
                let type = 'congratulate';
                if (btn.classList.contains('react-jealous')) type = 'jealous';
                if (btn.classList.contains('react-hate')) type = 'hate';
                const post = friendManager.envyNotifications.find(p => p.id === btn.dataset.id);
                if (post?.serverPost) {
                    const result = await window.stockWarsChat.room('newsReact', { postId: post.id, reaction: type });
                    if (result.error) { toastManager.show(result.error, false); return; }
                }
                const res = friendManager.reactToEnvyNotification(btn.dataset.id, type);
                toastManager.show(res.message, res.success);
                if (res.success) {
                    this.renderEnvyView();
                    if (res.fpGained > 0) toastManager.show(`우호도 +${res.fpGained}`, true);
                }
            });
        });
    }

    openChatRoom(roomId) {
        this.setEmoticonPanelOpen(false);
        if (this.currentRoomId !== roomId && (roomId === 'players' || roomId.startsWith('group_'))) {
            this.playerMessages = [];
            this.playerChatStatus = '채팅방 연결 중';
        }
        this.currentRoomId = roomId;
        const room = this.chatRooms.find(r => r.id === roomId);
        if (!room) return;
        room.unread = 0;

        if (roomId === 'rumor' && this.latestState?.news) {
            const rawRumors = this.latestState.news.filter(n => n.type === '찌라시');
            rawRumors.forEach(r => this.readRumorIds.add(r.id || r.title || r.content));
        }

        this.updateBadges();
        if (this.dom.ktRoomTitle) this.dom.ktRoomTitle.textContent = room.title;
        if (this.dom.ktRoomSub) this.dom.ktRoomSub.textContent = room.sub;
        this.bubbleNavBar?.classList.add('hidden');
        this.dom.kakaotalkListView?.classList.add('hidden');
        this.dom.kakaotalkRoomView?.classList.remove('hidden');
        const inviteButton = document.getElementById('btnBubbleInviteFriends');
        if (inviteButton) inviteButton.hidden = !roomId.startsWith('local_') && !roomId.startsWith('group_');
        const inputBar = document.getElementById('bubbleInputBar');
        const notice = document.getElementById('bubbleReadOnlyNotice');
        if (inputBar) inputBar.hidden = !!room.readOnly;
        if (notice) notice.hidden = !room.readOnly;
        if (this.dom.bubbleMsgInput) {
            this.dom.bubbleMsgInput.disabled = !!room.readOnly;
            this.dom.bubbleMsgInput.maxLength = 500;
            this.dom.bubbleMsgInput.placeholder = roomId === 'players' ? '플레이어에게 메시지 보내기 (최대 500자)' : '메시지 입력';
        }
        this.renderMessages(roomId);
        if (roomId === 'players' || roomId.startsWith('group_')) void this.refreshPlayerChat();
    }

    getRoomTitle(roomId) {
        const room = this.chatRooms.find(r => r.id === roomId);
        return room ? room.title : '대화방';
    }

    setEmoticonPanelOpen(open) {
        if (this.chatRooms.find(room => room.id === this.currentRoomId)?.readOnly) open = false;
        this.emoticonPanelOpen = open;
        const panel = document.getElementById('bubbleEmoticonPanel');
        if (panel) {
            panel.hidden = !open;
            panel.classList.toggle('hidden', !open);
        }
        document.getElementById('btnKtEmoticon')?.setAttribute('aria-expanded', String(open));
    }

    renderMessages(roomId = 'rumor') {
        if (!this.dom.bubbleChatFeed) return;
        if (roomId === 'players' || roomId.startsWith('group_')) { this.renderPlayerMessages(); return; }
        this.dom.bubbleChatFeed.dataset.room = roomId;
        this.dom.bubbleChatFeed.dataset.room = roomId;
        const state = this.latestState;
        const stocksMap = state ? new Map(state.stocks.map(s => [s.id, s])) : new Map();

        let html = `<div class="chat-date-header"><span class="chat-date-pill">📅 오늘 • ${escapeHtml(this.getRoomTitle(roomId))}</span></div>`;

        if (roomId === 'rumor') {
            const rawRumors = (state?.news || []).filter(n => n.type === '찌라시');
            if (rawRumors.length === 0) {
                html += `<div class="chat-system-banner">🐥 수신된 찌라시가 없습니다. 개장 후 실시간 수신됩니다.</div>`;
            } else {
                rawRumors.forEach((r, idx) => {
                    const stock = r.targetStockId ? stocksMap.get(r.targetStockId) : (r.stockId ? stocksMap.get(r.stockId) : null);
                    const isPos = r.isPositive !== false;
                    const senders = [
                        { name: '여의도 우주갈매기', avatar: '🦅', role: '세력 포착' },
                        { name: '익명의 펀드매니저', avatar: '🕵️‍♂️', role: 'VIP 소식통' },
                        { name: '증권가 찌라시통', avatar: '📡', role: '루머 헌터' }
                    ];
                    const s = senders[idx % senders.length];
                    const timeStr = r.time || '오후 12:43';

                    html += `
                        <div class="chat-row incoming">
                            <div class="chat-avatar-col"><div class="chat-avatar">${s.avatar}</div></div>
                            <div class="chat-bubble-col">
                                <div class="chat-sender-meta"><span class="sender-name">${s.name}</span><span class="sender-role-badge">${s.role}</span></div>
                                <div class="chat-bubble-wrap">
                                    <div class="chat-bubble incoming-bubble">
                                        <div class="chat-rumor-tag ${isPos ? 'gainer' : 'loser'}">
                                            <span>${isPos ? '🔥 급등 찌라시' : '⚠️ 급락 루머'}</span><span class="tag-impact">${r.impact || '+15.0%'}</span>
                                        </div>
                                        <div class="chat-bubble-title">📢 ${r.title || '시장 비공개 루머'}</div>
                                        <div class="chat-bubble-text">${r.content}</div>
                                        ${stock ? `<div class="chat-stock-card">
                                            <div class="chat-stock-info"><span class="chat-stock-name">📈 ${stock.name}</span><span class="chat-stock-price">${stock.price.toLocaleString()}G</span></div>
                                            <button class="chat-inline-stock-btn bubble-trade-btn" data-stock-id="${stock.id}">매매 바로가기 ➔</button>
                                        </div>` : ''}
                                    </div>
                                    <div class="chat-time"><span>${timeStr}</span></div>
                                </div>
                            </div>
                        </div>`;
                });
            }
        } else if (roomId === 'anna') {
            html += `<div class="chat-row incoming">
                <div class="chat-avatar-col"><div class="chat-avatar anna-avatar"><span class="anna-portrait" data-expression="Smile" role="img" aria-label="안나"></span></div></div>
                <div class="chat-bubble-col">
                    <div class="chat-sender-meta"><span class="sender-name">전담 매니저 안나</span><span class="sender-role-badge anna">멘토</span></div>
                    <div class="chat-bubble-wrap">
                        <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">파트너님, 좋은 아침이에요! ☀️<br>오늘도 수급을 파악해서 7일차 정산 목표 달성을 완료해 보아요!</div></div>
                        <div class="chat-time"><span>오전 09:15</span></div>
                    </div>
                </div>
            </div>`;
        } else if (roomId === 'quant') {
            html += `<div class="chat-row incoming">
                <div class="chat-avatar-col"><div class="chat-avatar">🤖</div></div>
                <div class="chat-bubble-col">
                    <div class="chat-sender-meta"><span class="sender-name">Cipher Quant AI</span><span class="sender-role-badge quant">시스템</span></div>
                    <div class="chat-bubble-wrap">
                        <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">📊 <b>[시그널 감지]</b> 글로벌 사이퍼 지수 모멘텀 우상향 지속 중.<br>기관/세력 수급 유입 종목 포착.</div></div>
                        <div class="chat-time"><span>방금 전</span></div>
                    </div>
                </div>
            </div>`;
        } else if (roomId === 'vivian') {
            html += `<div class="chat-row incoming">
                <div class="chat-avatar-col"><div class="chat-avatar">🛍️</div></div>
                <div class="chat-bubble-col">
                    <div class="chat-sender-meta"><span class="sender-name">비비안 점주</span></div>
                    <div class="chat-bubble-wrap">
                        <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">어서오세요! 오늘 잡화점에 신상 소모품 및 유료 찌라시가 수신되었습니다. 💖</div></div>
                        <div class="chat-time"><span>어제</span></div>
                    </div>
                </div>
            </div>`;
        }

        const userMsgs = this.bubbleUserMessages[roomId] || [];
        userMsgs.forEach(msg => {
            if (msg.type === 'received') {
                html += `<div class="chat-row incoming">
                    <div class="chat-avatar-col"><div class="chat-avatar">${escapeHtml(msg.sender ? msg.sender.charAt(0) : '👤')}</div></div>
                    <div class="chat-bubble-col">
                        <div class="chat-sender-meta"><span class="sender-name">${escapeHtml(msg.sender || '친구')}</span></div>
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">${escapeHtml(msg.text)}</div></div>
                            <div class="chat-time"><span>${msg.time}</span></div>
                        </div>
                    </div>
                </div>`;
            } else {
                html += `<div class="chat-row outgoing">
                    <div class="chat-bubble-col outgoing-col">
                        <div class="chat-bubble-wrap outgoing-wrap">
                            <div class="chat-time"><span class="read-receipt">1</span><span>${msg.time}</span></div>
                            <div class="chat-bubble outgoing-bubble"><div class="chat-bubble-text">${escapeHtml(msg.text)}</div></div>
                        </div>
                    </div>
                </div>`;
            }

            if (msg.reply) {
                html += `<div class="chat-row incoming">
                    <div class="chat-avatar-col"><div class="chat-avatar">${roomId === 'anna' ? '💼' : '🦅'}</div></div>
                    <div class="chat-bubble-col">
                        <div class="chat-sender-meta"><span class="sender-name">${roomId === 'anna' ? '안나 💼' : '여의도 우주갈매기'}</span></div>
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">${msg.reply}</div></div>
                            <div class="chat-time"><span>${msg.time}</span></div>
                        </div>
                    </div>
                </div>`;
            }
        });

        this.dom.bubbleChatFeed.innerHTML = html;
        this.dom.bubbleChatFeed.scrollTop = this.dom.bubbleChatFeed.scrollHeight;

        this.dom.bubbleChatFeed.querySelectorAll('.bubble-trade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stockId = btn.dataset.stockId;
                if (stockId && this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(stockId);
                }
            });
        });
    }

    async handleSendBubbleMessage() {
        if (this.chatRooms.find(room => room.id === this.currentRoomId)?.readOnly) return;
        if (!this.dom.bubbleMsgInput) return;
        const text = this.dom.bubbleMsgInput.value.trim();
        if (!text) return;
        if (this.currentRoomId?.startsWith('local_')) {
            const room = this.chatRooms.find(r => r.id === this.currentRoomId);
            this.bubbleUserMessages[room.id].push({ text: text.slice(0, 500), time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) });
            room.lastMsg = `나: ${text}`;
            room.time = '방금 전';
            this.dom.bubbleMsgInput.value = '';
            this.saveLocalRooms();
            this.renderMessages(room.id);
            return;
        }
        if (this.currentRoomId === 'players' || this.currentRoomId?.startsWith('group_')) {
            if (this.sendingPlayerMessage) return;
            if (!window.stockWarsChat) { toastManager.show('플레이어 채팅은 서버에 연결된 데스크톱 앱에서 사용할 수 있습니다.', false); return; }
            this.sendingPlayerMessage = true;
            if (this.dom.btnBubbleSend) this.dom.btnBubbleSend.disabled = true;
            try {
                const roomId = this.currentRoomId;
                const result = roomId.startsWith('group_') ? await window.stockWarsChat.room('send', { roomId, text }) : await window.stockWarsChat.send(text);
                if (result.error) { toastManager.show(result.error, false); return; }
                if (this.dom.bubbleMsgInput.value.trim() === text) this.dom.bubbleMsgInput.value = '';
                if (this.currentRoomId === roomId) this.applyPlayerChat(result);
            } catch { toastManager.show('메시지를 보내지 못했습니다. 다시 시도해 주세요.', false); }
            finally {
                this.sendingPlayerMessage = false;
                if (this.dom.btnBubbleSend) this.dom.btnBubbleSend.disabled = false;
            }
            return;
        }

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const roomId = this.currentRoomId || 'rumor';

        let reply = null;
        if (roomId === 'rumor') reply = ['ㅋㅋㅋ 그 정보 진짜야?', '차트 5일선 지지받는 거 보니까 가겠다', '익명 형님들 가즈아! 🔥'][Math.floor(Math.random() * 3)];
        else if (roomId === 'anna') reply = ['네, 파트너님! 신중히 수급을 관찰해 보아요! 💼', '7일차 월세 목표 달성을 위해 파이팅입니다!', '좋은 전략이에요. 언제든 물어보세요!'][Math.floor(Math.random() * 3)];
        else if (roomId === 'quant') reply = 'Cipher Quant AI: 수신된 텍스트 데이터를 시장 알고리즘에 수집하였습니다. ⚡';
        else reply = '메시지 감사합니다! 오늘도 성투하세요! 😊';

        if (!this.bubbleUserMessages[roomId]) this.bubbleUserMessages[roomId] = [];
        this.bubbleUserMessages[roomId].push({ text, time, reply });
        this.dom.bubbleMsgInput.value = '';
        this.renderMessages(roomId);

        const room = this.chatRooms.find(r => r.id === roomId);
        if (room) { room.lastMsg = `나: ${text}`; room.time = '방금 전'; }
    }

    openDirectMessageWithFriend(friend) {
        if (!friend) return;
        let room = this.chatRooms.find(r => r.id === friend.id);
        if (!room) {
            room = { id: friend.id, type: 'direct', title: `${friend.name}`, sub: `1:1 DM (${friend.title})`, avatar: friend.avatar || '👤', lastMsg: '대화를 시작해보세요!', time: '방금 전', unread: 0 };
            this.chatRooms.push(room);
            if (!this.bubbleUserMessages[friend.id]) {
                this.bubbleUserMessages[friend.id] = [{ sender: friend.name, text: `안녕하세요! 파트너님. ${friend.title} ${friend.name}입니다!`, time: '방금 전', type: 'received' }];
            }
        }
        this.openChatRoom(friend.id);
        this.dom.bubbleMsgInput?.focus();
    }

    async refreshPlayerChat() {
        if (this.refreshingPlayerChat) return;
        this.refreshingPlayerChat = true;
        try {
            const roomId = this.currentRoomId;
            const result = window.stockWarsChat ? (roomId?.startsWith('group_') ? await window.stockWarsChat.room('list', { roomId }) : await window.stockWarsChat.list())
                : { error: '서버에 연결된 데스크톱 앱에서 플레이어 채팅을 이용할 수 있습니다.' };
            if (result.error) {
                this.playerChatStatus = result.error;
                if (this.currentRoomId === 'players') this.renderPlayerMessages();
                return;
            }
            if (this.currentRoomId === roomId) this.applyPlayerChat(result);
        } catch {
            this.playerChatStatus = '채팅 서버 연결 끊김 · 재연결 중';
            if (this.currentRoomId === 'players') this.renderPlayerMessages();
        } finally { this.refreshingPlayerChat = false; }
    }

    applyPlayerChat(result) {
        this.availablePlayers = result.players || [];
        for (const info of result.rooms || []) {
            let existing = this.chatRooms.find(r => r.id === info.id);
            if (!existing) {
                existing = { id: info.id, type: 'open', avatar: '💬', unread: 0, lastMsg: '초대된 친구들과 대화하세요.', time: '' };
                this.chatRooms.push(existing);
            }
            existing.title = info.title;
            existing.members = info.members || [];
            existing.sub = `친구 오픈채팅 · ${info.count}명`;
        }
        const room = this.chatRooms.find(r => r.id === (this.currentRoomId?.startsWith('group_') ? this.currentRoomId : 'players'));
        if (room.id === 'players') room.hidden = !result.messages.length;
        if (room.id === 'players') room.hidden = !result.messages.length;
        this.roomLastMessageIds ||= {};
        const latestId = this.roomLastMessageIds[room.id] || 0;
        const visible = (this.currentRoomId === 'players' || this.currentRoomId?.startsWith('group_')) && !this.dom.bubbleApp?.classList.contains('hidden');
        if (this.playerChatReady && !visible) {
            room.unread += result.messages.filter(m => m.id > latestId && m.playerId !== result.playerId).length;
        }
        if (visible) room.unread = 0;
        this.playerChatReady = true;
        this.playerId = result.playerId;
        this.playerMessages = result.messages;
        this.roomLastMessageIds[room.id] = result.messages.at(-1)?.id || latestId;
        this.playerChatStatus = `접속 중 · 플레이어 ${result.playerId} · ${this.currentRoomId?.startsWith('group_') ? '초대된 친구들과 대화' : '전체 공개 채팅'}`;
        const last = result.messages.at(-1);
        if (last) { room.lastMsg = `${last.sender}: ${last.text}`; room.time = this.playerMessageTime(last.timestamp); }
        this.updateBadges();
        if (this.currentRoomId === 'players' || this.currentRoomId?.startsWith('group_')) this.renderPlayerMessages();
        else if (this.activeSubTab === 'chats') this.renderChatList();
    }

    playerMessageTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }

    renderPlayerMessages() {
        const feed = this.dom.bubbleChatFeed;
        const atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 60;
        const sameRoom = feed.dataset.room === this.currentRoomId;
        const previousScroll = feed.scrollTop;
        feed.dataset.room = this.currentRoomId;
        const status = `<div class="chat-system-banner">${escapeHtml(this.playerChatStatus)}</div>`;
        feed.innerHTML = status + (this.playerMessages.length ? this.playerMessages.map(msg => {
            const own = msg.playerId === this.playerId;
            return `<div class="chat-row ${own ? 'outgoing' : 'incoming'}">
                ${own ? '' : '<div class="chat-avatar-col"><div class="chat-avatar">👤</div></div>'}
                <div class="chat-bubble-col ${own ? 'outgoing-col' : ''}">
                    ${own ? '' : `<div class="chat-sender-meta"><span class="sender-name">${escapeHtml(msg.sender)}</span></div>`}
                    <div class="chat-bubble-wrap ${own ? 'outgoing-wrap' : ''}">
                        <div class="chat-bubble ${own ? 'outgoing-bubble' : 'incoming-bubble'}"><div class="chat-bubble-text" style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(msg.text)}</div></div>
                        <div class="chat-time"><span>${escapeHtml(this.playerMessageTime(msg.timestamp))}</span></div>
                    </div>
                </div></div>`;
        }).join('') : '<div class="chat-system-banner">아직 대화가 없습니다. 첫 인사를 남겨보세요!</div>');
        feed.scrollTop = !sameRoom || atBottom ? feed.scrollHeight : previousScroll;
    }

    closeRoomCreator() {
        const panel = document.getElementById('bubbleCreateRoomPanel');
        panel.hidden = true;
        panel.classList.add('hidden');
    }

    offerAchievementShare(achievement, name) {
        const dialog = document.createElement('dialog');
        dialog.className = 'bubble-inventory-picker';
        dialog.innerHTML = `<div class="bubble-section-heading"><strong>📈 수익을 실현했어요!</strong></div>
            <p>${escapeHtml(achievement.stockName)} ${achievement.quantity}주 매도<br><strong>+${achievement.profit.toLocaleString()}G · +${achievement.returnRate.toFixed(1)}%</strong></p>
            <label for="bubbleAchievementComment">한마디 남기기 (선택)</label>
            <input id="bubbleAchievementComment" class="bubble-achievement-comment" maxlength="80" placeholder="오늘의 투자 소감을 남겨보세요" />
            <div class="bubble-section-heading"><button class="bubble-add-friend-btn" data-cancel>다음에</button><button class="bubble-add-friend-btn" data-publish>친구들에게 자랑하기</button></div>`;
        dialog.querySelector('[data-cancel]').addEventListener('click', () => { dialog.close(); dialog.remove(); });
        dialog.addEventListener('cancel', () => dialog.remove());
        dialog.querySelector('[data-publish]').addEventListener('click', async event => {
            event.currentTarget.disabled = true;
            const comment = dialog.querySelector('input').value;
            if (window.stockWarsChat?.room) {
                try {
                    const result = await window.stockWarsChat.room('newsPublish', { achievement, comment });
                    if (result.error) { toastManager.show(result.error, false); dialog.querySelector('[data-publish]').disabled = false; return; }
                    dialog.close(); dialog.remove();
                    await this.refreshFriendNews();
                    toastManager.show('친구 소식에 게시했습니다.', true);
                } catch { toastManager.show('게시하지 못했습니다. 다시 시도해 주세요.', false); dialog.querySelector('[data-publish]').disabled = false; }
                return;
            }
            const result = friendManager.publishAchievement(achievement, name, dialog.querySelector('input').value);
            toastManager.show(result.message, result.success);
            if (result.success) { dialog.close(); dialog.remove(); this.updateBadges(); if (this.activeSubTab === 'envy') this.renderEnvyView(); }
        });
        document.body.append(dialog);
        dialog.showModal();
    }

    async refreshFriendNews() {
        if (!window.stockWarsChat?.room || this.refreshingNews) return;
        this.refreshingNews = true;
        try {
            const result = await window.stockWarsChat.room('news', {});
            if (result.error) return;
            const friends = friendManager.getFriends();
            const posts = result.posts.filter(p => p.isOwn || friends.some(f => f.name === p.friendName)).map(p => ({ ...p, serverPost: true, friendId: friends.find(f => f.name === p.friendName)?.id }));
            friendManager.envyNotifications = [...posts, ...friendManager.envyNotifications.filter(p => !p.serverPost)];
            this.updateBadges();
            if (this.activeSubTab === 'envy') this.renderEnvyView();
        } catch { /* Retry on the next refresh without losing the existing feed. */ }
        finally { this.refreshingNews = false; }
    }

    openInventoryShare(friendId, kind) {
        const friend = friendManager.getFriend(friendId);
        if (!friend) return;
        if (!this.callbacks.getShareItems || !this.callbacks.shareInventoryItem) {
            toastManager.show('인벤토리를 불러올 수 없습니다.', false); return;
        }
        this.shareDialog?.remove();
        const dialog = document.createElement('dialog');
        dialog.className = 'bubble-inventory-picker';
        this.shareDialog = dialog;
        const items = this.callbacks.getShareItems().filter(item => item.quantity > 0 && !item.isEquipped && (kind === 'rumor' ? item.category === 'intel' : item.category !== 'intel'));
        dialog.innerHTML = `<div class="bubble-section-heading"><strong>${kind === 'rumor' ? '찌라시 공유' : '선물 선택'}</strong><button class="bubble-add-friend-btn" data-close>닫기</button></div>
            <p>${escapeHtml(friend.name)}님에게 보낼 아이템을 선택하세요.</p>
            <p class="bubble-add-hint">${kind === 'rumor' ? '보유한 찌라시 정보를 공유합니다. 원본은 유지됩니다.' : '선물하면 선택한 아이템 1개가 소모됩니다.'}</p>
            <div class="bubble-picker-items">${items.length ? items.map(item => `<button class="bubble-picker-item" data-item="${escapeHtml(item.id)}"><span>${escapeHtml(item.icon || '📦')}</span><span>${escapeHtml(item.name)}<small>보유 ${item.quantity}개</small></span></button>`).join('') : '<div class="empty-state">선택 가능한 아이템이 없습니다.</div>'}</div>`;
        dialog.querySelector('[data-close]').addEventListener('click', () => { dialog.close(); dialog.remove(); });
        dialog.addEventListener('cancel', () => dialog.remove());
        dialog.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', () => {
            const result = this.callbacks.shareInventoryItem(friendId, kind, button.dataset.item);
            toastManager.show(result.message, result.success);
            if (result.success) { dialog.close(); dialog.remove(); this.renderFriendsView(); }
        }));
        document.body.append(dialog);
        dialog.showModal();
    }

    async showRoomCreator() {
        await this.refreshPlayerChat();
        const panel = document.getElementById('bubbleCreateRoomPanel');
        panel.hidden = false;
        panel.classList.remove('hidden');
        document.getElementById('bubbleRoomName').focus();
    }

    async createPlayerRoom() {
        if (this.creatingRoom) return;
        const title = document.getElementById('bubbleRoomName').value.trim();
        const local = !window.stockWarsChat?.room;
        const members = [];
        if (!title || title.length > 40 || members.length > 20) { toastManager.show('방 이름은 1~40자, 참여자는 최대 20명입니다.', false); return; }
        if (local) {
            if (this.chatRooms.filter(r => r.id.startsWith('local_')).length >= 20) { toastManager.show('채팅방은 최대 20개까지 만들 수 있습니다.', false); return; }
            const id = `local_${globalThis.crypto?.randomUUID?.() || Date.now()}`;
            this.chatRooms.push({ id, title, members, type: 'open', sub: `로컬 테스트 · ${members.length + 1}명`, avatar: '💬', unread: 0, lastMsg: '대화를 시작해보세요!', time: '' });
            this.bubbleUserMessages[id] = [];
            this.saveLocalRooms();
            this.closeRoomCreator();
            this.openChatRoom(id);
            this.dom.bubbleMsgInput?.focus();
            return;
        }
        this.creatingRoom = true;
        const button = document.getElementById('btnBubbleCreateSubmit');
        button.disabled = true;
        try {
            const result = await window.stockWarsChat.room('create', { title, members });
            if (result.error) { toastManager.show(result.error, false); return; }
            this.chatRooms.push({ id: result.roomId, title, type: 'open', sub: `친구 오픈채팅 · ${members.length + 1}명`, avatar: '💬', unread: 0, lastMsg: '대화를 시작해보세요!', time: '' });
            this.playerMessages = [];
            this.closeRoomCreator();
            this.openChatRoom(result.roomId);
            this.dom.bubbleMsgInput?.focus();
        } catch { toastManager.show('채팅방을 만들지 못했습니다. 다시 시도해 주세요.', false); }
        finally { this.creatingRoom = false; button.disabled = false; }
    }

    saveLocalRooms() {
        try {
            localStorage.setItem('stockwars.bubble.rooms.v1', JSON.stringify(this.chatRooms.filter(r => r.id.startsWith('local_')).map(room => ({ room, messages: (this.bubbleUserMessages[room.id] || []).slice(-100) }))));
        } catch { toastManager.show('저장 공간을 사용할 수 없어 현재 실행 중에만 유지됩니다.', false); }
    }

    async openRoomInvite() {
        const room = this.chatRooms.find(r => r.id === this.currentRoomId);
        if (!room) return;
        const local = room.id.startsWith('local_');
        if (!local) await this.refreshPlayerChat();
        const friends = friendManager.getFriends().filter(f => local || !f.isTest);
        const dialog = document.createElement('dialog');
        dialog.className = 'bubble-room-sidebar';
        dialog.setAttribute('aria-label', '채팅방 참여자 및 친구 추가');
        const participants = local ? [
            { name: '나', avatar: '👤', own: true },
            ...(room.members || []).map(id => friendManager.getFriend(id) || { name: '알 수 없는 친구', avatar: '👤' })
        ] : (room.members || [this.playerId]).map(id => ({ name: `플레이어 ${id}`, avatar: '👤', own: id === this.playerId }));
        dialog.innerHTML = `<div class="bubble-sidebar-header"><strong>채팅방 메뉴</strong><button data-close class="bubble-add-friend-btn" aria-label="채팅방 메뉴 닫기">닫기</button></div>
            <div class="bubble-sidebar-body"><h3>${escapeHtml(room.title)}</h3>
            <div class="bubble-sidebar-heading">참여자 <span>${participants.length}명</span></div>
            <div class="bubble-sidebar-participants">${participants.map(person => `<div class="bubble-sidebar-person"><span class="bubble-sidebar-avatar">${escapeHtml(person.avatar || '👤')}</span><span>${escapeHtml(person.name)}</span>${person.own ? '<small>나</small>' : ''}</div>`).join('')}</div>
            <details class="bubble-sidebar-invite"><summary>+ 친구 추가</summary><div class="bubble-picker-items">${friends.map(friend => {
                const player = this.availablePlayers?.find(p => p.name === friend.name && p.id !== this.playerId);
                const id = local ? friend.id : player?.id;
                const added = (room.members || []).includes(id);
                return `<label class="bubble-member-option"><input type="checkbox" value="${escapeHtml(id || '')}" ${!id || added ? 'disabled' : ''} /><span>${escapeHtml(friend.name)}<small>${added ? '이미 참여 중' : local ? '로컬 테스트 참여자' : player ? '초대 가능' : '서버에서 찾을 수 없음'}</small></span></label>`;
            }).join('') || '<p class="empty-state">등록된 친구가 없습니다. 친구 탭에서 먼저 추가해 주세요.</p>'}</div><button data-invite class="bubble-add-friend-btn">선택한 친구 추가</button></details><button type="button" data-leave class="bubble-room-leave">채팅방 나가기</button></div>`;
        dialog.querySelector('[data-leave]').onclick = async () => {
            const button = dialog.querySelector('[data-leave]');
            if (button.dataset.confirm !== 'yes') {
                button.dataset.confirm = 'yes';
                button.textContent = '정말 나가기 · 목록에서 제거됩니다';
                return;
            }
            button.disabled = true;
            try {
                if (!local) {
                    const result = await window.stockWarsChat.room('leaveRoom', { roomId: room.id });
                    if (result.error) { toastManager.show(result.error, false); return; }
                }
                this.chatRooms = this.chatRooms.filter(r => r.id !== room.id);
                delete this.bubbleUserMessages[room.id];
                if (this.roomLastMessageIds) delete this.roomLastMessageIds[room.id];
                if (local) this.saveLocalRooms();
                dialog.close(); dialog.remove();
                this.activeSubTab = 'chats';
                this.switchSubView('chats');
                this.showChatList();
                this.updateBadges();
                toastManager.show('채팅방에서 나왔습니다.', true);
            } catch { toastManager.show('나가지 못했습니다. 다시 시도해 주세요.', false); }
            finally { button.disabled = false; }
        };
        dialog.querySelector('[data-close]').onclick = () => { dialog.close(); dialog.remove(); };
        dialog.addEventListener('cancel', () => dialog.remove());
        dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
                dialog.close(); dialog.remove();
            }
        });
        dialog.querySelector('[data-invite]').onclick = async event => {
            const members = [...dialog.querySelectorAll('input:checked')].map(input => local ? input.value : Number(input.value));
            if (!members.length) { toastManager.show('친구를 선택해 주세요.', false); return; }
            event.currentTarget.disabled = true;
            try {
                if (local) {
                    const merged = [...new Set([...(room.members || []), ...members])];
                    if (merged.length > 20) { toastManager.show('친구는 최대 20명까지 추가할 수 있습니다.', false); return; }
                    room.members = merged;
                    room.sub = `로컬 테스트 · ${merged.length + 1}명`;
                    this.saveLocalRooms();
                } else {
                    const result = await window.stockWarsChat.room('invite', { roomId: room.id, members });
                    if (result.error) { toastManager.show(result.error, false); return; }
                    room.members = result.members;
                    room.sub = `친구 오픈채팅 · ${result.members.length}명`;
                }
                if (this.currentRoomId === room.id && this.dom.ktRoomSub) this.dom.ktRoomSub.textContent = room.sub;
                toastManager.show('친구를 채팅방에 추가했습니다.', true);
                dialog.close(); dialog.remove();
                if (this.currentRoomId === room.id) void this.openRoomInvite();
            } catch { toastManager.show('친구 추가에 실패했습니다.', false); }
            finally { dialog.querySelector('[data-invite]').disabled = false; }
        };
        document.body.append(dialog);
        const bounds = this.dom.kakaotalkRoomView.getBoundingClientRect();
        const width = Math.min(290, bounds.width * 0.88);
        Object.assign(dialog.style, { top: `${bounds.top}px`, left: `${bounds.right - width}px`, width: `${width}px`, height: `${bounds.height}px` });
        dialog.showModal();
    }

    restoreLocalRooms() {
        try {
            const saved = JSON.parse(localStorage.getItem('stockwars.bubble.rooms.v1') || '[]');
            if (!Array.isArray(saved)) return;
            for (const entry of saved.slice(0, 20)) {
                if (!entry?.room || typeof entry.room.id !== 'string' || !entry.room.id.startsWith('local_') || typeof entry.room.title !== 'string') continue;
                this.chatRooms.push({ ...entry.room, type: 'open', avatar: '💬' });
                this.bubbleUserMessages[entry.room.id] = Array.isArray(entry.messages) ? entry.messages.slice(-100).filter(m => typeof m.text === 'string') : [];
            }
        } catch {}
    }
}
