/**
 * RankingModal.js
 * StockWars Social & Global Leaderboard Component
 * Displays Asset and Weekly Return Leaderboards with Social vs Global filter.
 */
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
import { friendManager } from '../engine/FriendManager.js';

export class RankingModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.rankingCategory = 'asset'; // 'asset' | 'return'
        this.rankingScope = 'social'; // 'social' | 'global'
        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="rankingModalOverlay" class="modal-overlay hidden" style="z-index: 9999;">
                <div class="ranking-modal-container glass-panel" role="dialog" aria-modal="true" aria-labelledby="rankingTitle">
                    <div class="ranking-modal-header">
                        <div class="header-title">
                            <span class="header-icon">🏆</span>
                            <h2 id="rankingTitle">랭킹 전당 (Leaderboard)</h2>
                        </div>
                        <button id="btnCloseRankingModal" class="ranking-close-btn" type="button" aria-label="랭킹 닫기" title="닫기 (ESC)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
                    </div>

                    <div class="ranking-filter-bar">
                        <div class="ranking-sub-tabs">
                            <button class="rank-sub-btn active" data-cat="asset">💰 자산왕</button>
                            <button class="rank-sub-btn" data-cat="return">📈 수익왕 (7일)</button>
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
        this.modalOverlay.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'Escape') { e.preventDefault(); this.hide(); }
            if (e.key === 'Tab') {
                const buttons = [...this.modalOverlay.querySelectorAll('button')];
                const first = buttons[0], last = buttons.at(-1);
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
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
        this.rankingCategory = category === 'return' ? 'return' : 'asset';
        this.rankingScope = scope;

        this.subTabs.forEach(b => b.classList.toggle('active', b.dataset.cat === this.rankingCategory));
        this.scopeTabs.forEach(b => b.classList.toggle('active', b.dataset.scope === scope));

        this.previousFocus = document.activeElement;
        this.modalOverlay.classList.remove('hidden');
        this.btnCloseModal.focus();
        void this.refreshRecords();
        clearInterval(this.refreshTimer);
        this.refreshTimer = setInterval(() => void this.refreshRecords(), 15000);
        this.renderRanking();
    }

    hide() {
        clearInterval(this.refreshTimer);
        this.requestVersion = (this.requestVersion || 0) + 1;
        this.modalOverlay.classList.add('hidden');
        this.previousFocus?.focus?.();
    }

    toggle() {
        if (this.modalOverlay.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    async refreshRecords() {
        const version = this.requestVersion = (this.requestVersion || 0) + 1;
        this.recordStatus = '실제 유저 기록을 불러오는 중…';
        this.renderRanking();
        try {
            const result = await this.callbacks.getRecords?.();
            if (version !== this.requestVersion || this.modalOverlay.classList.contains('hidden')) return;
            friendManager.leaderboardRecords = Array.isArray(result?.records) ? result.records : [];
            this.recordStatus = result?.error ? '서버 기록을 불러오지 못했습니다. 내 기록만 표시합니다. (' + result.error + ')' : '서버에 저장된 유저의 최신 플레이 기록';
        } catch { friendManager.leaderboardRecords = []; this.recordStatus = '서버 기록을 불러오지 못했습니다. 내 기록만 표시합니다.'; }
        if (version === this.requestVersion) this.renderRanking();
    }

    renderRanking() {
        const profile = this.callbacks.getProfile?.() || {};
        const list = friendManager.getLeaderboard(this.rankingCategory, this.rankingScope, profile);

        let catHeader = '보유 자산';
        let valFormatter = (item) => `${Math.round(item.netWorth).toLocaleString()} G`;
        if (this.rankingCategory === 'return') {
            catHeader = '7일 자산 수익률';
            valFormatter = (item) => `${item.weeklyReturn > 0 ? '+' : ''}${item.weeklyReturn.toFixed(2)}%`;

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
                <tbody>${!list.length ? '<tr><td colspan="4" class="ranking-empty">' + (this.rankingCategory === 'return' ? '7일 수익률 기록이 아직 없습니다.' : '등록된 유저 기록이 없습니다.') + '</td></tr>' : ''}
                    ${list.map(item => `
                        <tr class="${item.isMe ? 'my-rank-row' : ''}">
                            <td class="rank-col">
                                ${item.rank === 1 ? '🥇 1위' : item.rank === 2 ? '🥈 2위' : item.rank === 3 ? '🥉 3위' : `${item.rank}위`}
                            </td>
                            <td class="trader-col">
                                <span class="avatar">${escape(item.avatar || '👤')}</span>
                                <span class="name">${escape(item.name)}${item.isMe ? ' (나)' : ''}</span>
                            </td>
                            <td><span class="rank-title-badge">${escape(item.title || '트레이더')}</span></td>
                            <td class="val-col">${valFormatter(item)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p class="ranking-data-status" role="status">${escape(this.recordStatus || '내 실제 플레이 기록')}</p>
        `;
    }
}
