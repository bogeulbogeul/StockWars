/**
 * StockListTab Component (스마트폰 주식 시장 탭 & 티커)
 * Handles real-time stock lists, search, sector filtering, favorites, sorting, and marquee banner.
 */

import { SECTORS } from '../../data/stocksData.js';

export class StockListTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
        this.selectedSector = 'ALL';
        this.selectedSortMode = 'POPULAR';
        this.favorites = this.loadFavorites();

        this.initEventListeners();
    }

    initEventListeners() {
        // Sector filter horizontal scroll & drag
        if (this.dom.sectorChips) {
            const el = this.dom.sectorChips;
            el.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    el.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            let isDown = false, startX, scrollLeft;
            el.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - el.offsetLeft;
                scrollLeft = el.scrollLeft;
            });
            el.addEventListener('mouseleave', () => isDown = false);
            el.addEventListener('mouseup', () => isDown = false);
            el.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - el.offsetLeft;
                el.scrollLeft = scrollLeft - (x - startX) * 1.5;
            });

            // Sector Filter Click
            el.addEventListener('click', (e) => {
                const btn = e.target.closest('.chip-btn');
                if (btn) {
                    el.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    this.selectedSector = btn.dataset.sector;
                    if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
                }
            });
        }

        // Market Sort Select
        this.dom.marketSortSelect?.addEventListener('change', (e) => {
            this.selectedSortMode = e.target.value;
            if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
        });

        // Search Input
        this.dom.searchInput?.addEventListener('input', () => {
            if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
        });
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('stockwars_favorites');
            if (saved) return new Set(JSON.parse(saved));
        } catch (e) {}
        return new Set();
    }

    saveFavorites() {
        try {
            localStorage.setItem('stockwars_favorites', JSON.stringify(Array.from(this.favorites)));
        } catch (e) {}
    }

    toggleFavorite(stockId) {
        if (!stockId) return;
        if (this.favorites.has(stockId)) {
            this.favorites.delete(stockId);
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(☆  종목이 관심 종목에서 해제되었습니다.);
        } else {
            this.favorites.add(stockId);
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(⭐  종목이 관심 종목으로 등록되었습니다!);
        }
        this.saveFavorites();
        if (this.callbacks.onRequestRender) this.callbacks.onRequestRender();
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

        const itemHtml = 
            <div class="ticker-item index-item">
                <span class="ticker-index-label">🌐 글로벌 사이퍼 지수</span>
                <span class="ticker-index-val "> pts</span>
                <span class="ticker-index-pct ">(%)</span>
            </div>
        ;
        this.dom.tickerMarquee.innerHTML = itemHtml.repeat(6);
    }

    renderStockList(stocks) {
        if (!this.dom.stockListContainer || !stocks) return;
        const query = (this.dom.searchInput?.value || '').toLowerCase().trim();

        const filtered = stocks.filter(s => {
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
                return (favB + diffPctB * 100 + (b.price / 10)) - (favA + diffPctA * 100 + (a.price / 10));
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
            this.dom.stockListContainer.innerHTML = 
                <div class="empty-list-msg">
                    <span class="empty-icon">⭐</span>
                    <p></p>
                </div>
            ;
            return;
        }

        this.dom.stockListContainer.innerHTML = filtered.map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };
            const isFav = this.favorites && this.favorites.has(s.id);

            return 
                <div class="stock-item-row" data-id="">
                    <div class="item-left">
                        <div class="item-name-area">
                            <button class="item-fav-btn " data-fav-id="" title="관심 종목 토글">⭐</button>
                            <span class="item-name"></span>
                            <span class="item-code"></span>
                            <span class="sector-tag" style="background:; color:"></span>
                        </div>
                        <div class="item-desc"></div>
                    </div>
                    <div class="item-right">
                        <div class="item-price">G</div>
                        <div class="item-change ">
                            %
                        </div>
                    </div>
                </div>
            ;
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