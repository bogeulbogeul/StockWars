/**
 * FriendModal.js
 * StockWars GDD MOD_GDD_09 Friend & Social UI Component
 * Features Friend List, Friendship Points (FP), Envy Feed, and Social Leaderboards.
 */
import { friendManager } from '../engine/FriendManager.js';
import { toastManager } from './ToastManager.js';

export class FriendModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onOpenBubbleChat, onGainStamina }
        this.activeTab = 'list'; // 'list' | 'add' | 'envy' | 'ranking'
        this.rankingCategory = 'asset'; // 'asset' | 'return'
        this.selectedFriendForRumor = null;
        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="friendModalOverlay" class="modal-overlay hidden" style="z-index: 9999;">
                <div class="friend-modal-container glass-panel">
                    <!-- Modal Header -->
                    <div class="friend-modal-header">
                        <div class="header-title">
                            <span class="header-icon">👥</span>
                            <h2>친구 & 소셜 아레나 (Social Network)</h2>
                        </div>
                        <button id="btnCloseFriendModal" class="btn-close-icon">✕</button>
                    </div>

                    <!-- Navigation Tabs -->
                    <div class="friend-tabs">
                        <button class="friend-tab-btn active" data-tab="list">👥 친구 목록</button>
                        <button class="friend-tab-btn" data-tab="add">➕ 친구 추가</button>
                        <button class="friend-tab-btn" data-tab="envy">⚡ 배 아픈 알림</button>
                        <button class="friend-tab-btn" data-tab="ranking">🏆 소셜 랭킹</button>
                    </div>

                    <!-- Tab Contents Container -->
                    <div class="friend-modal-body">
                        <!-- Tab 1: Friend List -->
                        <div id="tabFriendList" class="tab-content">
                            <div class="friend-cards-list" id="friendCardsContainer"></div>
                        </div>

                        <!-- Tab 2: Add Friend -->
                        <div id="tabFriendAdd" class="tab-content hidden">
                            <div class="add-friend-box">
                                <label>트레이더 닉네임 / ID 검색</label>
                                <div class="search-input-group">
                                    <input type="text" id="inputFriendSearch" placeholder="닉네임 입력 (예: 차트신선)..." />
                                    <button id="btnAddFriendSubmit" class="btn-primary-sm">친구 신청</button>
                                </div>
                            </div>
                            <div class="recommended-title">💡 추천 매너 트레이더</div>
                            <div class="friend-cards-list" id="recommendedCardsContainer"></div>
                        </div>

                        <!-- Tab 3: Envy Feed -->
                        <div id="tabFriendEnvy" class="tab-content hidden">
                            <div class="envy-feed-header">
                                <span class="feed-desc">친구가 대박을 터뜨렸을 때 실시간 알림이 도착합니다! 🥳/😒/😡 이모지로 반응하여 우호도(FP)를 쌓으세요.</span>
                            </div>
                            <div class="envy-feed-list" id="envyFeedContainer"></div>
                        </div>

                        <!-- Tab 4: Social Leaderboard -->
                        <div id="tabFriendRanking" class="tab-content hidden">
                            <div class="ranking-sub-tabs">
                                <button class="rank-sub-btn active" data-cat="asset">💰 자산왕</button>
                                <button class="rank-sub-btn" data-cat="return">📈 수익왕 (7일)</button>
                            </div>
                            <div class="ranking-table-container" id="rankingTableContainer"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal for Selecting Rumor to Share -->
            <div id="rumorShareSelectorModal" class="modal-overlay hidden" style="z-index: 10000;">
                <div class="rumor-share-box glass-panel">
                    <div class="rumor-share-header">
                        <h3>📰 공유할 찌라시 선택</h3>
                        <button id="btnCloseRumorShareModal" class="btn-close-icon">✕</button>
                    </div>
                    <p id="rumorTargetFriendName" class="target-friend-desc"></p>
                    <div class="rumor-select-list" id="rumorSelectListContainer"></div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modalOverlay = document.getElementById('friendModalOverlay');
        this.btnCloseModal = document.getElementById('btnCloseFriendModal');
        this.tabBtns = this.modalOverlay.querySelectorAll('.friend-tab-btn');
        this.tabContents = {
            list: document.getElementById('tabFriendList'),
            add: document.getElementById('tabFriendAdd'),
            envy: document.getElementById('tabFriendEnvy'),
            ranking: document.getElementById('tabFriendRanking')
        };

        this.friendCardsContainer = document.getElementById('friendCardsContainer');
        this.recommendedCardsContainer = document.getElementById('recommendedCardsContainer');
        this.inputFriendSearch = document.getElementById('inputFriendSearch');
        this.btnAddFriendSubmit = document.getElementById('btnAddFriendSubmit');
        this.envyFeedContainer = document.getElementById('envyFeedContainer');
        this.rankingTableContainer = document.getElementById('rankingTableContainer');

        this.rumorShareModal = document.getElementById('rumorShareSelectorModal');
        this.btnCloseRumorShareModal = document.getElementById('btnCloseRumorShareModal');
        this.rumorTargetFriendName = document.getElementById('rumorTargetFriendName');
        this.rumorSelectListContainer = document.getElementById('rumorSelectListContainer');
    }

    initEventListeners() {
        this.btnCloseModal?.addEventListener('click', () => this.hide());
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hide();
        });

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        this.btnAddFriendSubmit?.addEventListener('click', () => {
            const val = this.inputFriendSearch.value;
            const res = friendManager.addFriendByName(val);
            toastManager.show(res.message, res.success);
            if (res.success) {
                this.inputFriendSearch.value = '';
                this.renderFriendList();
            }
        });

        this.modalOverlay.querySelectorAll('.rank-sub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.modalOverlay.querySelectorAll('.rank-sub-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.rankingCategory = btn.dataset.cat;
                this.renderRanking();
            });
        });

        this.btnCloseRumorShareModal?.addEventListener('click', () => {
            this.rumorShareModal.classList.add('hidden');
        });
    }

    toggle() {
        if (this.modalOverlay.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    show(tab = 'list') {
        this.modalOverlay.classList.remove('hidden');
        this.switchTab(tab);
    }

    hide() {
        this.modalOverlay.classList.add('hidden');
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.tabBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.tab === tab);
        });

        Object.keys(this.tabContents).forEach(key => {
            this.tabContents[key].classList.toggle('hidden', key !== tab);
        });

        if (tab === 'list') this.renderFriendList();
        else if (tab === 'add') this.renderAddTab();
        else if (tab === 'envy') this.renderEnvyFeed();
        else if (tab === 'ranking') this.renderRanking();
    }

    renderFriendList() {
        const friends = friendManager.getFriends();
        if (friends.length === 0) {
            this.friendCardsContainer.innerHTML = `<div class="empty-state">등록된 친구가 없습니다. 친구를 추가해보세요!</div>`;
            return;
        }

        this.friendCardsContainer.innerHTML = friends.map(f => {
            const lvl = f.levelInfo;
            const fpPercent = Math.min(100, Math.floor((f.fp / lvl.maxFp) * 100));

            return `
                <div class="friend-card">
                    <div class="friend-card-top">
                        <div class="friend-avatar">${f.avatar}</div>
                        <div class="friend-info">
                            <div class="friend-name-row">
                                <span class="friend-name">${f.name}</span>
                                <span class="friend-badge">${lvl.badge} ${lvl.name}</span>
                                <span class="status-indicator ${f.isOnline ? 'online' : 'offline'}">${f.isOnline ? '온라인' : '오프라인'}</span>
                            </div>
                            <div class="friend-sub-info">
                                <span>칭호: ${f.title}</span> | 
                                <span>자산: ${f.netWorth.toLocaleString()}G</span>
                            </div>
                        </div>
                    </div>

                    <!-- FP Progress Bar -->
                    <div class="fp-progress-box" title="${lvl.desc}">
                        <div class="fp-label-row">
                            <span>우호도 (FP): ${f.fp} / ${lvl.maxFp}</span>
                            <span class="fp-benefit-tag">${lvl.desc}</span>
                        </div>
                        <div class="fp-bar-bg">
                            <div class="fp-bar-fill" style="width: ${fpPercent}%;"></div>
                        </div>
                    </div>

                    <!-- Actions Bar -->
                    <div class="friend-actions">
                        <button class="btn-action gift" data-id="${f.id}" title="에너지 10P 선물 (+10 FP)">
                            ⚡ 에너지 선물
                        </button>
                        <button class="btn-action rumor" data-id="${f.id}" title="찌라시 복사본 공유 (+20 FP)">
                            📰 찌라시 공유
                        </button>
                        <button class="btn-action dm" data-id="${f.id}" title="버블 1:1 메시지">
                            💬 버블 DM
                        </button>
                        <button class="btn-action visit" data-id="${f.id}" title="홈 오피스 구경">
                            🏠 방 구경
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Bind Action Listeners
        this.friendCardsContainer.querySelectorAll('.btn-action.gift').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const res = friendManager.sendEnergyGift(id);
                toastManager.show(res.message, res.success);
                if (res.success) {
                    this.renderFriendList();
                }
            });
        });

        this.friendCardsContainer.querySelectorAll('.btn-action.rumor').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.openRumorShareModal(id);
            });
        });

        this.friendCardsContainer.querySelectorAll('.btn-action.dm').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const friend = friendManager.getFriend(id);
                this.hide();
                if (this.callbacks.onOpenBubbleChat) {
                    this.callbacks.onOpenBubbleChat(friend);
                }
            });
        });

        this.friendCardsContainer.querySelectorAll('.btn-action.visit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const friend = friendManager.getFriend(id);
                toastManager.show(`🏠 ${friend.name}님의 오피스를 방문했습니다! 오피스 인테리어를 감상하세요.`);
            });
        });
    }

    openRumorShareModal(friendId) {
        const friend = friendManager.getFriend(friendId);
        if (!friend) return;
        this.selectedFriendForRumor = friend;
        this.rumorTargetFriendName.textContent = `[${friend.name}] 님에게 공유할 찌라시를 선택하세요:`;

        const sampleRumors = [
            { id: 'r1', title: 'IT 반도체 합병설 비밀 찌라시', content: 'CyberIT와 GlobalSemi 3분기 빅딜 예정' },
            { id: 'r2', title: '바이오 3상 임상 완료 전단지', content: 'BioHealth 신약 승인 임박' },
            { id: 'r3', title: '엔터테인먼트 메가 루키 신규 계약', content: 'StarEnt 아이돌 컴백 스케줄' }
        ];

        this.rumorSelectListContainer.innerHTML = sampleRumors.map(r => `
            <div class="rumor-item-card">
                <div class="rumor-title">📰 ${r.title}</div>
                <div class="rumor-content">${r.content}</div>
                <button class="btn-share-rumor-now" data-title="${r.title}">공유하기</button>
            </div>
        `).join('');

        this.rumorSelectListContainer.querySelectorAll('.btn-share-rumor-now').forEach(btn => {
            btn.addEventListener('click', () => {
                const title = btn.dataset.title;
                const res = friendManager.shareRumor(this.selectedFriendForRumor.id, title);
                toastManager.show(res.message, res.success);
                this.rumorShareModal.classList.add('hidden');
                if (res.success) {
                    this.renderFriendList();
                }
            });
        });

        this.rumorShareModal.classList.remove('hidden');
    }

    renderAddTab() {
        const recommended = [
            { name: '차트신선_이프로', title: '스캘핑 마스터', avatar: '🧙‍♂️' },
            { name: '대박희망_김대리', title: '성장주 매니아', avatar: '🦸' },
            { name: '알고리즘_윤봇', title: '자동매매 개발자', avatar: '🤖' }
        ];

        this.recommendedCardsContainer.innerHTML = recommended.map(r => `
            <div class="friend-card mini">
                <div class="friend-avatar">${r.avatar}</div>
                <div class="friend-info">
                    <span class="friend-name">${r.name}</span>
                    <span class="friend-sub-info">${r.title}</span>
                </div>
                <button class="btn-primary-sm btn-quick-add" data-name="${r.name}">+ 친구 추가</button>
            </div>
        `).join('');

        this.recommendedCardsContainer.querySelectorAll('.btn-quick-add').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const res = friendManager.addFriendByName(name);
                toastManager.show(res.message, res.success);
                if (res.success) this.switchTab('list');
            });
        });
    }

    renderEnvyFeed() {
        const feed = friendManager.envyNotifications;
        if (feed.length === 0) {
            this.envyFeedContainer.innerHTML = `<div class="empty-state">아직 소셜 알림이 없습니다.</div>`;
            return;
        }

        this.envyFeedContainer.innerHTML = feed.map(item => `
            <div class="envy-feed-card ${item.reacted ? 'reacted' : ''}">
                <div class="envy-feed-top">
                    <span class="envy-icon">${item.icon}</span>
                    <div class="envy-text-group">
                        <div class="envy-title">${item.trigger} · <span class="time">${item.timestamp}</span></div>
                        <div class="envy-msg">${item.message}</div>
                    </div>
                </div>
                <div class="envy-reactions">
                    ${item.reacted ? `<span class="reacted-tag">✅ 이미 반응 완료</span>` : `
                        <button class="btn-envy react-congrats" data-id="${item.id}" title="축하하기 (+5 FP)">🥳 축하 (+5 FP)</button>
                        <button class="btn-envy react-jealous" data-id="${item.id}" title="질투하기 (+1 FP)">😒 새침 (+1 FP)</button>
                        <button class="btn-envy react-hate" data-id="${item.id}" title="분노하기 (+0 FP)">😡 싫어요 (+0)</button>
                    `}
                </div>
            </div>
        `).join('');

        this.envyFeedContainer.querySelectorAll('.btn-envy').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                let type = 'congratulate';
                if (btn.classList.contains('react-jealous')) type = 'jealous';
                if (btn.classList.contains('react-hate')) type = 'hate';

                const res = friendManager.reactToEnvyNotification(id, type);
                toastManager.show(res.message, res.success);
                if (res.success) this.renderEnvyFeed();
            });
        });
    }

    renderRanking() {
        const list = friendManager.getLeaderboard(this.rankingCategory, 'social', this.callbacks.getRankingProfile?.() || {});

        let catHeader = '자산';
        let valFormatter = (item) => `${item.netWorth.toLocaleString()} G`;
        if (this.rankingCategory === 'return') {
            catHeader = '주간 수익률';
            valFormatter = (item) => `${item.weeklyReturn > 0 ? '+' : ''}${item.weeklyReturn}%`;

        }

        this.rankingTableContainer.innerHTML = `
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>트레이더</th>
                        <th>칭호</th>
                        <th>${catHeader}</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map(item => `
                        <tr class="${item.isMe ? 'my-rank-row' : ''}">
                            <td class="rank-col">
                                ${item.rank === 1 ? '🥇 1위' : item.rank === 2 ? '🥈 2위' : item.rank === 3 ? '🥉 3위' : `${item.rank}위`}
                            </td>
                            <td class="trader-col">
                                <span class="avatar">${item.avatar}</span>
                                <span class="name">${item.name}</span>
                            </td>
                            <td><span class="rank-title-badge">${item.title}</span></td>
                            <td class="val-col">${valFormatter(item)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}
