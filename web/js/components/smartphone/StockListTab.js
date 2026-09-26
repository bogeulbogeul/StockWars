/**
 * StockListTab Component (스마트폰 HTS 주식 거래 탭 & 상단 티커 마키)
 * Handles search query, sector filter chips, sorting (인기순/변동률순/가격순/이름순), favorite starring, and live list rendering.
 */

import { SECTORS } from '../../data/stocksData.js';

export class StockListTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.selectedSector = 'ALL';
        this.selectedSortMode = 'POPULAR';
        this.favorites = this.loadFavorites();
        this.latestStocks = [];

        this.initEventListeners();
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('stockwars_favorites');
            return saved ? new Set(JSON.parse(saved)) : new Set(['CLOUDBERRY', 'ECOBATTERY']);
        } catch (e) {
            return new Set(['CLOUDBERRY', 'ECOBATTERY']);
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('stockwars_favorites', JSON.stringify([...this.favorites]));
        } catch (e) {}
    }

    toggleFavorite(stockId) {
        if (!stockId) return;
        if (this.favorites.has(stockId)) {
            this.favorites.delete(stockId);
        } else {
            this.favorites.add(stockId);
        }
        this.saveFavorites();
        this.renderStockList(this.latestStocks);

        if (this.callbacks.onFavoriteChanged) {
            this.callbacks.onFavoriteChanged(stockId, this.favorites.has(stockId));
        }
    }

    initEventListeners() {
        // Search Input
        this.dom.searchInput?.addEventListener('input', () => {
            this.renderStockList(this.latestStocks);
        });

        // Sector Filter Chips
        if (this.dom.sectorChips) {
            this.dom.sectorChips.querySelectorAll('.chip-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.sectorChips.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedSector = btn.dataset.sector || 'ALL';
                    this.renderStockList(this.latestStocks);
                });
            });
        }

        // Sort Select
        this.dom.marketSortSelect?.addEventListener('change', (e) => {
            this.selectedSortMode = e.target.value;
            this.renderStockList(this.latestStocks);
        });
    }

    updateState(state) {
        if (!state) return;
        this.renderTickerMarquee(state.cipherIndex);
        this.renderStockList(state.stocks);
    }

    renderTickerMarquee(cipherIndex) {
        if (!this.dom.tickerMarquee || !cipherIndex) return;
        const isPos = cipherIndex.diffPct >= 0;
        const sign = isPos ? '▲+' : '▼';

        const itemHtml = `
            <div class="ticker-item index-item">
                <span class="ticker-index-label">🌐 글로벌 사이퍼 지수</span>
                <span class="ticker-index-val ${isPos ? 'gainer' : 'loser'}">${cipherIndex.val} pts</span>
                <span class="ticker-index-pct ${isPos ? 'gainer' : 'loser'}">(${sign}${cipherIndex.diffPct.toFixed(2)}%)</span>
            </div>
        `;
        this.dom.tickerMarquee.innerHTML = itemHtml.repeat(6);
    }

    renderStockList(stocks, recentlyViewedIds = []) {
        this.latestStocks = stocks || [];
        if (!this.dom.stockListContainer) return;
        const query = (this.dom.searchInput?.value || '').toLowerCase().trim();

        const filtered = this.latestStocks.filter(s => {
            const matchSector = this.selectedSector === 'FAV'
                ? (this.favorites && this.favorites.has(s.id))
                : (this.selectedSector === 'ALL' || s.sector === this.selectedSector);
            const matchQuery = !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
            return matchSector && matchQuery;
        });

        const sortMode = this.selectedSortMode || 'POPULAR';
        filtered.sort((a, b) => {
            const diffPctA = a.prevPrice > 0 ? Math.abs((a.price - a.prevPrice) / a.prevPrice) * 100 : 0;
            const diffPctB = b.prevPrice > 0 ? Math.abs((b.price - b.prevPrice) / b.prevPrice) * 100 : 0;

            if (sortMode === 'POPULAR') {
                const favA = (this.favorites && this.favorites.has(a.id)) ? 1000 : 0;
                const favB = (this.favorites && this.favorites.has(b.id)) ? 1000 : 0;
                const recA = (recentlyViewedIds && recentlyViewedIds.includes(a.id)) ? 500 : 0;
                const recB = (recentlyViewedIds && recentlyViewedIds.includes(b.id)) ? 500 : 0;
                return (favB + recB + diffPctB * 100 + (b.price / 10)) - (favA + recA + diffPctA * 100 + (a.price / 10));
            } else if (sortMode === 'CHANGE') {
                return diffPctB - diffPctA;
            } else if (sortMode === 'PRICE') {
                return b.price - a.price;
            } else if (sortMode === 'NAME') {
                return a.name.localeCompare(b.name, 'ko');
            }
            return 0;
        });

        if (filtered.length === 0) {
            this.dom.stockListContainer.innerHTML = `
                <div class="empty-list-msg">
                    <span class="empty-icon">⭐</span>
                    <p>${this.selectedSector === 'FAV' ? '등록된 관심 종목이 없습니다.<br>종목 상단의 별(⭐) 아이콘을 눌러 관심 종목으로 등록해보세요!' : '검색 결과가 없습니다.'}</p>
                </div>
            `;
            return;
        }

        this.dom.stockListContainer.innerHTML = filtered.map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };
            const isFav = this.favorites && this.favorites.has(s.id);

            return `
                <div class="stock-item-row" data-id="${s.id}">
                    <div class="item-left">
                        <div class="item-name-area">
                            <button class="item-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${s.id}" title="관심 종목 토글">⭐</button>
                            <span class="item-name">${s.name}</span>
                            <span class="item-code">${s.id}</span>
                            <span class="sector-tag" style="background:${sec.bg}; color:${sec.color}">${sec.name}</span>
                        </div>
                        <div class="item-desc">${s.desc}</div>
                    </div>
                    <div class="item-right">
                        <div class="item-price">${s.price.toLocaleString()}G</div>
                        <div class="item-change ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '+' : ''}${diffPct.toFixed(2)}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.stockListContainer.querySelectorAll('.item-fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.favId);
            });
        });

        this.dom.stockListContainer.querySelectorAll('.stock-item-row').forEach(row => {
            row.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(row.dataset.id);
                }
            });
        });
    }
}