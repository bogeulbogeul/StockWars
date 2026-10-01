/**
 * RankingModal.js
 * StockWars Social & Global Leaderboard Component
 * Displays Asset, Weekly Return, and Style Score Leaderboards with Social vs Global filter.
 */
import { friendManager } from '../engine/FriendManager.js';

export class RankingModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.rankingCategory = 'asset'; // 'asset' | 'return' | 'style'
        this.rankingScope = 'social'; // 'social' | 'global'
        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="rankingModalOverlay" class="modal-overlay hidden" style="z-index: 9999;">
                <div class="ranking-modal-container glass-panel">
                    <div class="ranking-modal-header">
                        <div class="header-title">
                            <span class="header-icon">🏆</span>
                            <h2>랭킹 전당 (Leaderboard)</h2>
                        </div>
                        <button id="btnCloseRankingModal" class="btn-close-icon">✕</button>
                    </div>

                    <div class="ranking-filter-bar">
                        <div class="ranking-sub-tabs">
                            <button class="rank-sub-btn active" data-cat="asset">💰 자산왕</button>
                            <button class="rank-sub-btn" data-cat="return">📈 수익왕 (7일)</button>
                            <button class="rank-sub-btn" data-cat="style">🎨 스타일왕</button>
                        </div>
                        <div class="ranking-scope-tabs">
                            <button class="rank-scope-btn active" data-scope="social">👥 소셜 랭킹</button>
                            <button class="rank-scope-btn" data-scope="global">🌐 전체 랭킹</button>
                        </div>
                    </div>

                    <div class="ranking-modal-body">
                        <div class="ranking-table-container" id="modalRankingTableContainer"></div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modalOverlay = document.getElementById('rankingModalOverlay');
        this.btnCloseModal = document.getElementById('btnCloseRankingModal');
        this.rankingTableContainer = document.getElementById('modalRankingTableContainer');
        this.subTabs = this.modalOverlay.querySelectorAll('.rank-sub-btn');
        this.scopeTabs = this.modalOverlay.querySelectorAll('.rank-scope-btn');
    }

    initEventListeners() {
        this.btnCloseModal?.addEventListener('click', () => this.hide());
        this.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.hide();
        });

        this.subTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                this.subTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.rankingCategory = btn.dataset.cat;
                this.renderRanking();
            });
        });

        this.scopeTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                this.scopeTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.rankingScope = btn.dataset.scope;
                this.renderRanking();
            });
        });
    }

    show(category = 'asset', scope = 'social') {
        this.rankingCategory = category;
        this.rankingScope = scope;

        this.subTabs.forEach(b => b.classList.toggle('active', b.dataset.cat === category));
        this.scopeTabs.forEach(b => b.classList.toggle('active', b.dataset.scope === scope));

        this.modalOverlay.classList.remove('hidden');
        this.renderRanking();
    }

    hide() {
        this.modalOverlay.classList.add('hidden');
    }

    toggle() {
        if (this.modalOverlay.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    renderRanking() {
        const list = friendManager.getLeaderboard(this.rankingCategory, this.rankingScope, {
            name: '나 (Player)',
            title: '개미 트레이더',
            netWorth: 5000000,
            weeklyReturn: 18.5,
            styleScore: 1250
        });

        let catHeader = '보유 자산';
        let valFormatter = (item) => `${item.netWorth.toLocaleString()} G`;
        if (this.rankingCategory === 'return') {
            catHeader = '주간 수익률';
            valFormatter = (item) => `${item.weeklyReturn > 0 ? '+' : ''}${item.weeklyReturn}%`;
        } else if (this.rankingCategory === 'style') {
            catHeader = '스타일 점수';
            valFormatter = (item) => `${item.styleScore} pt`;
        }

        this.rankingTableContainer.innerHTML = `
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>순위</th>
                        <th>트레이더</th>
                        <th>신용/칭호</th>
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
