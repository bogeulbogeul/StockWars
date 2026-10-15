/**
 * HomeTab Component (스마트폰 HTS 홈 탭)
 * Handles Net Worth summary and Recently Viewed stocks grid.
 */

import { SECTORS } from '../../data/stocksData.js?v=v72';

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

        // Header Day Tag

        // Summary Net Worth & Cash Stats
        if (this.dom.homeNetWorth) this.dom.homeNetWorth.textContent = `${state.totalNetWorth.toLocaleString()} Gold`;
        if (this.dom.homeCash) this.dom.homeCash.textContent = `${state.cash.toLocaleString()}G`;
        if (this.dom.homePortfolioVal) this.dom.homePortfolioVal.textContent = `${state.portfolioValue.toLocaleString()}G`;

        if (this.dom.homeProfitLoss) {
            const isPos = state.totalProfitLoss >= 0;
            const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / (state.initialCash || 5000)) * 100 : 0;
            this.dom.homeProfitLoss.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()}G (${isPos ? '+' : ''}${pct.toFixed(1)}%)`;
            this.dom.homeProfitLoss.className = `stat-val ${isPos ? 'gainer' : 'loser'}`;
        }

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

            return `
                <div class="hot-stock-card" data-id="${s.id}">
                    <div class="hot-card-top">
                        <span class="hot-stock-name">${s.name}</span>
                        <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                    </div>
                    <div class="hot-card-price">${s.price.toLocaleString()}G</div>
                    <div class="hot-card-change ${isPos ? 'gainer' : 'loser'}">
                        ${isPos ? '▲' : '▼'} ${Math.abs(diffPct).toFixed(2)}%
                    </div>
                </div>
            `;
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