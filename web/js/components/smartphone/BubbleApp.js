/**
 * BubbleApp Component (카카오톡 스타일 모바일 메신저 + 친구 & 소셜 루프)
 * Features Open Chat Rooms, 1:1 Direct Messages, Friend List, FP Progress, and Envy Feed.
 */
import { friendManager } from '../../engine/FriendManager.js';
import { toastManager } from '../ToastManager.js';

export class BubbleApp {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.activeFilter = 'all';
        this.activeSubTab = 'chats';
        this.currentRoomId = null;
        this.latestState = null;
        this.readRumorIds = new Set();
        this.chatRooms = [
            { id: 'rumor', type: 'open', title: '여의도 참새방앗간 🐣', sub: '오픈채팅 1,420명', avatar: '🐣', lastMsg: '익명 찌라시 라운지 활성화', time: '방금 전', unread: 0 },
            { id: 'quant', type: 'open', title: 'Cipher 퀀트 AI ⚡', sub: '오픈채팅 850명', avatar: '🤖', lastMsg: 'Quant AI: 변동성 시그널 포착', time: '10분 전', unread: 0 },
            { id: 'anna', type: 'direct', title: '전담 매니저 안나 💼', sub: '1:1 개인채팅', avatar: '💼', lastMsg: '안나: 파트너님, 좋은 아침이에요!', time: '오전 09:15', unread: 0 },
            { id: 'vivian', type: 'direct', title: '비비안 잡화점 🛍️', sub: '1:1 개인채팅', avatar: '🛍️', lastMsg: '비비안: 오늘 보급품 매대가 갱신되었습니다.', time: '어제', unread: 0 }
        ];
        this.bubbleUserMessages = { rumor: [], anna: [], quant: [], vivian: [] };

        this.initDOM();
        this.initEventListeners();
        this.showChatList();
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
            if (e.key === 'Enter') this.handleSendBubbleMessage();
        });

        document.getElementById('btnKtEmoticon')?.addEventListener('click', () => {
            if (this.dom.bubbleMsgInput) { this.dom.bubbleMsgInput.value += ` ${['🚀','📈','🔥','💰','👍','😊'][Math.floor(Math.random()*6)]}`; this.dom.bubbleMsgInput.focus(); }
        });
        document.getElementById('btnKtHash')?.addEventListener('click', () => {
            if (this.dom.bubbleMsgInput) { this.dom.bubbleMsgInput.value += ' #주식'; this.dom.bubbleMsgInput.focus(); }
        });

        this.dom.btnBubbleRefresh?.addEventListener('click', () => {
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
    }

    switchSubView(tabName) {
        this.activeSubTab = tabName;
        this.navTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
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
        this.currentRoomId = null;
        this.bubbleNavBar?.classList.remove('hidden');
        this.dom.kakaotalkListView?.classList.remove('hidden');
        this.dom.kakaotalkRoomView?.classList.add('hidden');
        this.renderActiveSubView();
    }

    renderChatList() {
        if (!this.dom.ktRoomList) return;
        const filtered = this.chatRooms.filter(room => {
            if (this.activeFilter === 'open') return room.type === 'open';
            if (this.activeFilter === 'direct') return room.type === 'direct';
            return true;
        });

        this.dom.ktRoomList.innerHTML = filtered.map(room => `
            <div class="kt-room-item" data-id="${room.id}">
                <div class="kt-room-avatar">${room.avatar}</div>
                <div class="kt-room-content">
                    <div class="kt-room-top-row">
                        <span class="kt-room-name">${room.title}</span>
                        <span class="kt-room-badge ${room.type}">${room.sub}</span>
                    </div>
                    <div class="kt-room-last-msg">${room.lastMsg}</div>
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
                        <div class="friend-name-row"><span class="friend-name">${f.name}</span><span class="friend-badge">${lvl.badge} ${lvl.name}</span></div>
                        <div class="friend-sub-info">${f.title} | 자산 ${f.netWorth.toLocaleString()}G</div>
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
                const res = friendManager.sendEnergyGift(btn.dataset.id);
                toastManager.show(res.message, res.success);
                if (res.success) this.renderFriendsView();
            });
        });
        this.ktFriendsContainer.querySelectorAll('.btn-action.rumor').forEach(btn => {
            btn.addEventListener('click', () => {
                const res = friendManager.shareRumor(btn.dataset.id, 'IT 반도체 비밀 찌라시');
                toastManager.show(res.message, res.success);
                if (res.success) this.renderFriendsView();
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
        const recommended = [
            { name: '차트신선_이프로', title: '스캘핑 마스터', avatar: '🧙‍♂️' },
            { name: '대박희망_김대리', title: '성장주 매니아', avatar: '🦸' },
            { name: '알고리즘_윤봇', title: '자동매매 개발자', avatar: '🤖' }
        ];
        this.ktRecommendedContainer.innerHTML = recommended.map(r => `
            <div class="friend-card mini" style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="friend-avatar">${r.avatar}</div>
                    <div><div class="friend-name">${r.name}</div><div class="friend-sub-info">${r.title}</div></div>
                </div>
                <button class="btn-primary-sm btn-quick-add" data-name="${r.name}">+ 추가</button>
            </div>`).join('');

        this.ktRecommendedContainer.querySelectorAll('.btn-quick-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const res = friendManager.addFriendByName(btn.dataset.name);
                toastManager.show(res.message, res.success);
                if (res.success) this.switchSubView('friends');
            });
        });
    }

    renderEnvyView() {
        if (!this.ktEnvyFeedContainer) return;
        const feed = friendManager.envyNotifications;
        if (feed.length === 0) {
            this.ktEnvyFeedContainer.innerHTML = `<div class="empty-state">소셜 알림이 없습니다.</div>`;
            return;
        }

        this.ktEnvyFeedContainer.innerHTML = feed.map(item => `
            <div class="envy-feed-card ${item.reacted ? 'reacted' : ''}">
                <div class="envy-feed-top">
                    <span class="envy-icon">${item.icon}</span>
                    <div><div class="envy-title">${item.trigger} · <span class="time">${item.timestamp}</span></div><div class="envy-msg">${item.message}</div></div>
                </div>
                <div class="envy-reactions">
                    ${item.reacted ? `<span class="reacted-tag">✅ 반응 완료</span>` : `
                        <button class="btn-envy react-congrats" data-id="${item.id}">🥳 축하</button>
                        <button class="btn-envy react-jealous" data-id="${item.id}">😒 질투</button>
                        <button class="btn-envy react-hate" data-id="${item.id}">😡 싫어요</button>`}
                </div>
            </div>`).join('');

        this.ktEnvyFeedContainer.querySelectorAll('.btn-envy').forEach(btn => {
            btn.addEventListener('click', () => {
                let type = 'congratulate';
                if (btn.classList.contains('react-jealous')) type = 'jealous';
                if (btn.classList.contains('react-hate')) type = 'hate';
                const res = friendManager.reactToEnvyNotification(btn.dataset.id, type);
                toastManager.show(res.message, res.success);
                if (res.success) this.renderEnvyView();
            });
        });
    }

    openChatRoom(roomId) {
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
        this.renderMessages(roomId);
    }

    getRoomTitle(roomId) {
        const room = this.chatRooms.find(r => r.id === roomId);
        return room ? room.title : '대화방';
    }

    renderMessages(roomId = 'rumor') {
        if (!this.dom.bubbleChatFeed) return;
        const state = this.latestState;
        const stocksMap = state ? new Map(state.stocks.map(s => [s.id, s])) : new Map();

        let html = `<div class="chat-date-header"><span class="chat-date-pill">📅 오늘 • ${this.getRoomTitle(roomId)}</span></div>`;

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
                    <div class="chat-avatar-col"><div class="chat-avatar">${msg.sender ? msg.sender.charAt(0) : '👤'}</div></div>
                    <div class="chat-bubble-col">
                        <div class="chat-sender-meta"><span class="sender-name">${msg.sender || '친구'}</span></div>
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble incoming-bubble"><div class="chat-bubble-text">${msg.text}</div></div>
                            <div class="chat-time"><span>${msg.time}</span></div>
                        </div>
                    </div>
                </div>`;
            } else {
                html += `<div class="chat-row outgoing">
                    <div class="chat-bubble-col outgoing-col">
                        <div class="chat-bubble-wrap outgoing-wrap">
                            <div class="chat-time"><span class="read-receipt">1</span><span>${msg.time}</span></div>
                            <div class="chat-bubble outgoing-bubble"><div class="chat-bubble-text">${msg.text}</div></div>
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

    handleSendBubbleMessage() {
        if (!this.dom.bubbleMsgInput) return;
        const text = this.dom.bubbleMsgInput.value.trim();
        if (!text) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const roomId = this.currentRoomId || 'rumor';

        let reply = null;
        if (roomId === 'rumor') reply = ['ㅋㅋㅋ 그 정보 진짜야?', '차트 5일선 지지받는 거 보니까 가겠다', '익명 형님들 가즈아! 🔥'][Math.floor(Math.random() * 3)];
        else if (roomId === 'anna') reply = ['네, 파트너님! 신중히 수급을 관찰해 보아요! 💼', '7일차 월세 목표 달성을 위해 파이팅입니다!', '좋은 전략이에요. 언제든 물어보세요!'][Math.floor(Math.random() * 3)];
        else if (roomId === 'quant') reply = 'Cipher Quant AI: 수신된 텍스트 데이터를 시장 알고리즘에 수집하였습니다. ⚡';
        else if (roomId === 'vivian') reply = '필요하신 소모품이나 정보가 있다면 매대를 방문해주세요~ 🛍️';
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
    }
}
