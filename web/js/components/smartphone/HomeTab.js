/**
 * HomeTab Component (스마트폰 HTS 홈 탭)
 * Handles Net Worth summary, 7-day rent goal progress, Cipher Index banner, and Recently Viewed stocks grid.
 */

import { SECTORS } from '../../data/stocksData.js';

export class HomeTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.recentlyViewedIds = ['CLOUDBERRY', 'SOCIALMIX', 'ECOBATTERY', 'COZYPAY'];
        this.initEventListeners();
    }

    initEventListeners() {
        this.dom.summaryCard?.addEventListener('click', () => {
            if (this.callbacks.onSwitchTab) this.callbacks.onSwitchTab('Profile');
        });
    }

    recordRecentlyViewed(stockId) {
        if (!stockId) return;
        this.recentlyViewedIds = [stockId, ...this.recentlyViewedIds.filter(id => id !== stockId)].slice(0, 4);
    }

    updateState(state) {
        if (!state) return;

        // Cipher Index Banner & Home Widgets
        if (state.cipherIndex) {
            const isPos = state.cipherIndex.diffPct >= 0;
            const sign = isPos ? '+' : '';
            const text = ${state.cipherIndex.val} pts;
            const changeText = ${sign}%;

            if (this.dom.bannerCipherVal) this.dom.bannerCipherVal.textContent = text;
            if (this.dom.bannerCipherChange) {
                this.dom.bannerCipherChange.textContent = changeText;
                this.dom.bannerCipherChange.className = cipher-change ;
            }
            if (this.dom.widgetIndex) this.dom.widgetIndex.textContent = Cipher ;
            if (this.dom.widgetIndexSub) {
                this.dom.widgetIndexSub.textContent = ${changeText} Today;
                this.dom.widgetIndexSub.className = widget-sub ;
            }
        }

        // Summary Net Worth & Cash Stats
        if (this.dom.homeNetWorth) this.dom.homeNetWorth.textContent = ${state.totalNetWorth.toLocaleString()} Gold;
        if (this.dom.homeCash) this.dom.homeCash.textContent = ${state.cash.toLocaleString()}G;
        if (this.dom.homePortfolioVal) this.dom.homePortfolioVal.textContent = ${state.portfolioValue.toLocaleString()}G;

        if (this.dom.homeProfitLoss) {
            const isPos = state.totalProfitLoss >= 0;
            const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / (state.initialCash || 5000)) * 100 : 0;
            this.dom.homeProfitLoss.textContent = ${isPos ? '+' : ''}G (%);
            this.dom.homeProfitLoss.className = stat-val ;
        }

        if (this.dom.settlementDDay) this.dom.settlementDDay.textContent = 정산 D-;

        // Rent Goal Progress
        const rentPct = Math.min(100, Math.max(0, (state.totalNetWorth / state.targetRent) * 100));
        if (this.dom.rentGoalText) this.dom.rentGoalText.textContent = ${state.totalNetWorth.toLocaleString()}G 중 G;
        if (this.dom.rentProgressFill) this.dom.rentProgressFill.style.width = ${rentPct}%;

        this.renderRecentlyViewedStocks(state.stocks);
    }

    renderRecentlyViewedStocks(stocks) {
        if (!this.dom.recentStocksGrid || !stocks) return;
        const stockMap = new Map(stocks.map(s => [s.id, s]));
        let items = (this.recentlyViewedIds || []).map(id => stockMap.get(id)).filter(Boolean);

        if (items.length < 4) {
            for (const s of stocks) {
                if (items.length >= 4) break;
                if (!items.find(x => x.id === s.id)) items.push(s);
            }
        }

        this.dom.recentStocksGrid.innerHTML = items.slice(0, 4).map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };

            return 
                <div class="hot-stock-card" data-id="">
                    <div class="hot-card-top">
                        <span class="hot-stock-name"></span>
                        <span class="sector-tag" style="background:; color:"></span>
                    </div>
                    <div class="hot-card-price">G</div>
                    <div class="hot-card-change ">
                         %
                    </div>
                </div>
            ;
        }).join('');

        this.dom.recentStocksGrid.querySelectorAll('.hot-stock-card').forEach(card => {
            card.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(card.dataset.id);
                }
            });
        });
    }
}