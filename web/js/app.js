/**
 * StockWars Main Web App Controller
 * Connects UI DOM, Event Listeners, Canvas Chart, Market Engine,
 * and Smartphone OS Navigation.
 */

import { marketEngine } from './engine/marketEngine.js';
import { StockChartRenderer } from './components/chart.js';
import { SECTORS } from './data/stocksData.js';

class StockWarsApp {
    constructor() {
        this.selectedStockId = 'CLOUDBERRY';
        this.selectedSector = 'ALL';
        this.chartRenderer = null;
        this.tradeQty = 1;

        this.initDOM();
        this.initEventListeners();
        this.initChart();

        // Subscribe to Market Engine state changes
        marketEngine.subscribe(state => this.render(state));
        this.render(marketEngine.getState());
    }

    initDOM() {
        // Top controls
        this.btnToggleFrame = document.getElementById('btnToggleFrame');
        this.txtFrameToggle = document.getElementById('txtFrameToggle');
        this.btnFastForwardDay = document.getElementById('btnFastForwardDay');
        this.btnTriggerSettlement = document.getElementById('btnTriggerSettlement');
        this.btnResetDemo = document.getElementById('btnResetDemo');

        // Phone OS & App Views
        this.homeScreen = document.getElementById('homeScreen');
        this.stockApp = document.getElementById('stockApp');
        this.iconStockApp = document.getElementById('iconStockApp');
        this.statusClock = document.getElementById('statusClock');
        this.headerDayBadge = document.getElementById('headerDayBadge');

        // Marquee
        this.tickerMarquee = document.getElementById('tickerMarquee');

        // Home Tab
        this.homeNetWorth = document.getElementById('homeNetWorth');
        this.homeCash = document.getElementById('homeCash');
        this.homePortfolioVal = document.getElementById('homePortfolioVal');
        this.homeProfitLoss = document.getElementById('homeProfitLoss');
        this.settlementDDay = document.getElementById('settlementDDay');
        this.rentGoalText = document.getElementById('rentGoalText');
        this.rentProgressFill = document.getElementById('rentProgressFill');
        this.recentStocksGrid = document.getElementById('recentStocksGrid') || document.getElementById('hotStocksGrid');
        this.recentlyViewedIds = ['MOMO', 'SOCIAL', 'ECOBAT', 'PATCHWORK'];
        this.favorites = this.loadFavorites();
        this.selectedSortMode = 'POPULAR'; // 'POPULAR', 'CHANGE', 'PRICE', 'NAME'

        // Market Tab
        this.searchInput = document.getElementById('searchInput');
        this.sectorChips = document.getElementById('sectorChips');
        this.marketSortBar = document.getElementById('marketSortBar');
        this.marketSortSelect = document.getElementById('marketSortSelect');
        this.stockListContainer = document.getElementById('stockListContainer');

        // News Tab
        this.newsListContainer = document.getElementById('newsListContainer');

        // Profile Tab
        this.portfolioListContainer = document.getElementById('portfolioListContainer');
        this.btnProfileSettlement = document.getElementById('btnProfileSettlement');
        this.btnProfileReset = document.getElementById('btnProfileReset');

        // Navigation
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.tabViews = document.querySelectorAll('.tab-view');

        // Trade Modal
        this.tradeModal = document.getElementById('tradeModal');
        this.btnCloseTradeModal = document.getElementById('btnCloseTradeModal');
        this.btnFavoriteStock = document.getElementById('btnFavoriteStock');
        this.modalStockName = document.getElementById('modalStockName');
        this.modalStockCode = document.getElementById('modalStockCode');
        this.modalStockSector = document.getElementById('modalStockSector');
        this.modalStockPrice = document.getElementById('modalStockPrice');
        this.modalStockChange = document.getElementById('modalStockChange');
        this.orderbookRows = document.getElementById('orderbookRows');
        this.tradeQtyInput = document.getElementById('tradeQtyInput');
        this.btnQtyMinus = document.getElementById('btnQtyMinus');
        this.btnQtyPlus = document.getElementById('btnQtyPlus');
        this.btnQtyMax = document.getElementById('btnQtyMax');
        this.modalTotalCost = document.getElementById('modalTotalCost');
        this.btnBuyExecute = document.getElementById('btnBuyExecute');
        this.btnSellExecute = document.getElementById('btnSellExecute');

        // Settlement Modal
        this.settlementModal = document.getElementById('settlementModal');
        this.btnCloseSettlement = document.getElementById('btnCloseSettlement');
        this.settleCash = document.getElementById('settleCash');
        this.settlePortfolio = document.getElementById('settlePortfolio');
        this.settleTotalWorth = document.getElementById('settleTotalWorth');
        this.settleRentDeduction = document.getElementById('settleRentDeduction');
        this.settleFinalRemain = document.getElementById('settleFinalRemain');
        this.resultStamp = document.getElementById('resultStamp');
        this.resultGrade = document.getElementById('resultGrade');

        // Clock Update
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    initChart() {
        const canvas = document.getElementById('stockCanvasChart');
        if (canvas) {
            this.chartRenderer = new StockChartRenderer(canvas);
        }
    }

    updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        if (this.statusClock) this.statusClock.textContent = `${hrs}:${mins}`;
    }

    initEventListeners() {
        // Frame Toggle
        this.btnToggleFrame?.addEventListener('click', () => {
            document.body.classList.remove('phone-minimized');
            document.body.classList.toggle('phone-view-active');
            const isActive = document.body.classList.contains('phone-view-active');
            if (this.txtFrameToggle) {
                this.txtFrameToggle.textContent = isActive ? '전체 화면 전환' : '스마트폰 프레임 전환';
            }
        });

        // Fast forward day
        this.btnFastForwardDay?.addEventListener('click', () => {
            marketEngine.nextDay();
            this.showToast('📅 다음 날로 진행되었습니다.');
        });

        // Trigger Settlement
        this.btnTriggerSettlement?.addEventListener('click', () => this.showSettlementModal());
        this.btnProfileSettlement?.addEventListener('click', () => this.showSettlementModal());
        this.btnCloseSettlement?.addEventListener('click', () => this.settlementModal.classList.add('hidden'));

        // Reset
        this.btnResetDemo?.addEventListener('click', () => {
            marketEngine.reset();
            this.showToast('🔄 시현 데모 데이터가 초기화되었습니다.');
        });
        this.btnProfileReset?.addEventListener('click', () => {
            marketEngine.reset();
            this.showToast('🔄 시현 데모 데이터가 초기화되었습니다.');
        });

        // Click outside smartphone frame to minimize & show Isometric Rooftop view
        const deviceContainer = document.querySelector('.device-container');
        const phoneShell = document.querySelector('.phone-shell');
        const floatingPhoneBtn = document.getElementById('floatingPhoneBtn');
        const btnRestorePhoneCenter = document.getElementById('btnRestorePhoneCenter');

        if (deviceContainer && phoneShell) {
            deviceContainer.addEventListener('click', (e) => {
                if (document.body.classList.contains('phone-view-active') &&
                    !phoneShell.contains(e.target) && 
                    !e.target.closest('.modal-overlay') && 
                    !e.target.closest('.demo-top-bar')) {
                    document.body.classList.add('phone-minimized');
                }
            });
        }

        const restorePhone = (e) => {
            if (e) e.stopPropagation();
            document.body.classList.remove('phone-minimized');
        };

        floatingPhoneBtn?.addEventListener('click', restorePhone);
        btnRestorePhoneCenter?.addEventListener('click', restorePhone);

        // Phone Home & App Launching
        this.iconStockApp?.addEventListener('click', () => {
            this.homeScreen.classList.remove('active');
            this.stockApp.classList.add('active');
        });

        document.getElementById('summaryCard')?.addEventListener('click', () => {
            this.switchTab('Profile');
        });

        // App Navigation Tabs
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        if (this.sectorChips) {
            const el = this.sectorChips;
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
        }

        // Sector Filter Chips
        this.sectorChips?.addEventListener('click', e => {
            if (e.target.classList.contains('chip-btn')) {
                document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedSector = e.target.dataset.sector;
                this.render(marketEngine.getState());
            }
        });

        // Market Sort Select Dropdown
        this.marketSortSelect?.addEventListener('change', e => {
            this.selectedSortMode = e.target.value;
            this.render(marketEngine.getState());
        });

        // Search Input
        this.searchInput?.addEventListener('input', () => this.render(marketEngine.getState()));

        // Trade Modal Close
        this.btnCloseTradeModal?.addEventListener('click', () => this.tradeModal.classList.add('hidden'));
        this.btnFavoriteStock?.addEventListener('click', () => this.toggleFavorite());

        // Trade Quantity Controls
        this.btnQtyMinus?.addEventListener('click', () => {
            this.tradeQty = Math.max(1, this.tradeQty - 1);
            this.tradeQtyInput.value = this.tradeQty;
            this.updateTradeModalCalculations();
        });
        this.btnQtyPlus?.addEventListener('click', () => {
            this.tradeQty += 1;
            this.tradeQtyInput.value = this.tradeQty;
            this.updateTradeModalCalculations();
        });
        this.tradeQtyInput?.addEventListener('input', e => {
            this.tradeQty = Math.max(1, parseInt(e.target.value) || 1);
            this.updateTradeModalCalculations();
        });

        document.querySelectorAll('.q-btn').forEach(b => {
            b.addEventListener('click', () => {
                const val = b.dataset.qty;
                if (val === 'MAX') {
                    const state = marketEngine.getState();
                    const stock = marketEngine.stocks.get(this.selectedStockId);
                    if (stock && stock.price > 0) {
                        this.tradeQty = Math.max(1, Math.floor(state.cash / stock.price));
                    }
                } else {
                    this.tradeQty = parseInt(val) || 1;
                }
                this.tradeQtyInput.value = this.tradeQty;
                this.updateTradeModalCalculations();
            });
        });

        // Buy / Sell Execution
        this.btnBuyExecute?.addEventListener('click', () => {
            const res = marketEngine.buyStock(this.selectedStockId, this.tradeQty);
            this.showToast(res.msg, res.success);
            if (res.success) this.updateTradeModalCalculations();
        });
        this.btnSellExecute?.addEventListener('click', () => {
            const res = marketEngine.sellStock(this.selectedStockId, this.tradeQty);
            this.showToast(res.msg, res.success);
            if (res.success) this.updateTradeModalCalculations();
        });
    }

    switchTab(targetTab) {
        if (!targetTab) return;
        this.navTabs.forEach(t => {
            if (t.dataset.tab === targetTab) t.classList.add('active');
            else t.classList.remove('active');
        });
        this.tabViews.forEach(v => v.classList.remove('active'));
        const view = document.getElementById(`tab${targetTab}View`);
        if (view) view.classList.add('active');
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('stockwars_favorites');
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch (e) {}
        return new Set();
    }

    saveFavorites() {
        try {
            localStorage.setItem('stockwars_favorites', JSON.stringify(Array.from(this.favorites)));
        } catch (e) {}
    }

    toggleFavorite(stockId) {
        const targetId = stockId || this.selectedStockId;
        if (!targetId) return;
        const stock = marketEngine.stocks.get(targetId);
        const name = stock ? stock.name : targetId;

        if (!this.favorites) this.favorites = this.loadFavorites();

        if (this.favorites.has(targetId)) {
            this.favorites.delete(targetId);
            this.showToast(`☆ ${name} 종목이 관심 종목에서 해제되었습니다.`);
        } else {
            this.favorites.add(targetId);
            this.showToast(`⭐ ${name} 종목이 관심 종목으로 등록되었습니다!`);
        }

        this.saveFavorites();
        this.updateFavoriteBtnState();
        this.render(marketEngine.getState());
    }

    updateFavoriteBtnState() {
        if (!this.btnFavoriteStock) return;
        if (!this.favorites) this.favorites = this.loadFavorites();
        const isFav = this.favorites.has(this.selectedStockId);
        if (isFav) {
            this.btnFavoriteStock.textContent = '⭐';
            this.btnFavoriteStock.classList.add('active');
            this.btnFavoriteStock.title = '관심 종목 해제';
        } else {
            this.btnFavoriteStock.textContent = '⭐';
            this.btnFavoriteStock.classList.remove('active');
            this.btnFavoriteStock.title = '관심 종목 등록';
        }
    }

    recordRecentlyViewed(stockId) {
        if (!stockId) return;
        if (!this.recentlyViewedIds) this.recentlyViewedIds = ['MOMO', 'SOCIAL', 'ECOBAT', 'PATCHWORK'];
        this.recentlyViewedIds = [stockId, ...this.recentlyViewedIds.filter(id => id !== stockId)].slice(0, 4);
    }

    openTradeModal(stockId) {
        this.recordRecentlyViewed(stockId);
        this.selectedStockId = stockId;
        this.tradeQty = 1;
        if (this.tradeQtyInput) this.tradeQtyInput.value = 1;

        this.tradeModal.classList.remove('hidden');
        this.updateTradeModal();
    }

    updateTradeModal() {
        const stock = marketEngine.stocks.get(this.selectedStockId);
        if (!stock) return;

        const diff = stock.price - stock.prevPrice;
        const diffPct = stock.prevPrice > 0 ? (diff / stock.prevPrice) * 100 : 0;
        const isPositive = diff >= 0;

        if (this.modalStockName) this.modalStockName.textContent = stock.name;
        if (this.modalStockCode) this.modalStockCode.textContent = stock.id;
        if (this.modalStockSector) {
            const sec = SECTORS[stock.sector] || { name: stock.sector, color: '#00e5ff' };
            this.modalStockSector.textContent = sec.name;
            this.modalStockSector.style.color = sec.color;
            this.modalStockSector.style.background = sec.bg || 'rgba(0, 229, 255, 0.15)';
        }

        if (this.modalStockPrice) this.modalStockPrice.textContent = `${stock.price.toLocaleString()} Gold`;
        if (this.modalStockChange) {
            this.modalStockChange.textContent = `${isPositive ? '+' : ''}${diffPct.toFixed(2)}% (${diff > 0 ? '+' : ''}${diff}G)`;
            this.modalStockChange.className = `price-change-tag ${isPositive ? 'gainer' : 'loser'}`;
        }

        // Render Canvas Chart
        const history = marketEngine.priceHistory.get(this.selectedStockId) || [stock.price];
        this.chartRenderer?.render(history, isPositive);

        // Render Orderbook
        const ob = marketEngine.getOrderBook(this.selectedStockId);
        this.renderOrderbook(ob);

        this.updateTradeModalCalculations();
    }

    renderOrderbook(ob) {
        if (!this.orderbookRows) return;
        let html = '';

        // Asks (Selling prices - higher)
        ob.asks.forEach(item => {
            html += `
                <div class="ob-row ask">
                    <div class="ob-fill" style="width: ${item.pct}%;"></div>
                    <span class="ob-price">${item.price.toLocaleString()}</span>
                    <span class="ob-vol">${item.vol}</span>
                </div>
            `;
        });

        // Bids (Buying prices - lower)
        ob.bids.forEach(item => {
            html += `
                <div class="ob-row bid">
                    <div class="ob-fill" style="width: ${item.pct}%;"></div>
                    <span class="ob-price">${item.price.toLocaleString()}</span>
                    <span class="ob-vol">${item.vol}</span>
                </div>
            `;
        });

        this.orderbookRows.innerHTML = html;
    }

    updateTradeModalCalculations() {
        const stock = marketEngine.stocks.get(this.selectedStockId);
        if (stock && this.modalTotalCost) {
            const total = stock.price * this.tradeQty;
            this.modalTotalCost.textContent = `${total.toLocaleString()} Gold`;
        }
    }

    render(state) {
        if (this.headerDayBadge) this.headerDayBadge.textContent = `Day ${state.day} / ${state.maxDays}`;

        // Home View Summary
        if (this.homeNetWorth) this.homeNetWorth.textContent = `${state.totalNetWorth.toLocaleString()} Gold`;
        if (this.homeCash) this.homeCash.textContent = `${state.cash.toLocaleString()}G`;
        if (this.homePortfolioVal) this.homePortfolioVal.textContent = `${state.portfolioValue.toLocaleString()}G`;
        
        if (this.homeProfitLoss) {
            const isPos = state.totalProfitLoss >= 0;
            const pct = state.totalNetWorth > 0 ? (state.totalProfitLoss / 5000) * 100 : 0;
            this.homeProfitLoss.textContent = `${isPos ? '+' : ''}${state.totalProfitLoss.toLocaleString()}G (${isPos ? '+' : ''}${pct.toFixed(1)}%)`;
            this.homeProfitLoss.className = `stat-val ${isPos ? 'gainer' : 'loser'}`;
        }

        if (this.settlementDDay) this.settlementDDay.textContent = `정산 D-${state.maxDays - state.day + 1}`;

        // Rent progress
        const rentPct = Math.min(100, Math.max(0, (state.totalNetWorth / state.targetRent) * 100));
        if (this.rentGoalText) this.rentGoalText.textContent = `${state.totalNetWorth.toLocaleString()}G 중 ${state.targetRent.toLocaleString()}G`;
        if (this.rentProgressFill) this.rentProgressFill.style.width = `${rentPct}%`;

        // Ticker Marquee
        this.renderTickerMarquee(state.stocks);

        // Recently Viewed Stocks Grid
        this.renderRecentlyViewedStocks(state.stocks);

        // Stock List
        this.renderStockList(state.stocks);

        // News List
        this.renderNews(state.news);

        // Portfolio List
        this.renderPortfolio(state.portfolio);

        // Refresh modal if open
        if (!this.tradeModal.classList.contains('hidden')) {
            this.updateTradeModal();
        }
    }

    renderTickerMarquee(stocks) {
        if (!this.tickerMarquee) return;
        const items = stocks.slice(0, 10).map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            return `
                <div class="ticker-item">
                    <span>${s.name}</span>
                    <span class="${isPos ? 'gainer' : 'loser'}">${s.price.toLocaleString()} (${isPos ? '▲' : '▼'}${Math.abs(diffPct).toFixed(1)}%)</span>
                </div>
            `;
        }).join('');
        this.tickerMarquee.innerHTML = items + items; // Duplicate for smooth marquee loop
    }

    renderRecentlyViewedStocks(stocks) {
        const grid = this.recentStocksGrid || this.hotStocksGrid;
        if (!grid) return;
        const stockMap = new Map(stocks.map(s => [s.id, s]));
        let items = (this.recentlyViewedIds || []).map(id => stockMap.get(id)).filter(Boolean);
        if (items.length < 4) {
            for (const s of stocks) {
                if (items.length >= 4) break;
                if (!items.find(x => x.id === s.id)) items.push(s);
            }
        }

        grid.innerHTML = items.slice(0, 4).map(s => {
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

        grid.querySelectorAll('.hot-stock-card').forEach(card => {
            card.addEventListener('click', () => this.openTradeModal(card.dataset.id));
        });
    }

    renderStockList(stocks) {
        if (!this.stockListContainer) return;
        const query = (this.searchInput?.value || '').toLowerCase().trim();

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
                const recA = (this.recentlyViewedIds && this.recentlyViewedIds.includes(a.id)) ? 500 : 0;
                const recB = (this.recentlyViewedIds && this.recentlyViewedIds.includes(b.id)) ? 500 : 0;
                const scoreA = favA + recA + diffPctA * 100 + (a.price / 10);
                const scoreB = favB + recB + diffPctB * 100 + (b.price / 10);
                return scoreB - scoreA;
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
            this.stockListContainer.innerHTML = `
                <div class="empty-list-msg">
                    <span class="empty-icon">⭐</span>
                    <p>${this.selectedSector === 'FAV' ? '등록된 관심 종목이 없습니다.<br>종목 상단의 별(⭐) 아이콘을 눌러 관심 종목으로 등록해보세요!' : '검색 결과가 없습니다.'}</p>
                </div>
            `;
            return;
        }

        this.stockListContainer.innerHTML = filtered.map(s => {
            const diff = s.price - s.prevPrice;
            const diffPct = s.prevPrice > 0 ? (diff / s.prevPrice) * 100 : 0;
            const isPos = diff >= 0;
            const sec = SECTORS[s.sector] || { name: s.sector, color: '#00e5ff' };

            return `
                <div class="stock-item-row" data-id="${s.id}">
                    <div class="item-left">
                        <div class="item-name-area">
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

        this.stockListContainer.querySelectorAll('.stock-item-row').forEach(row => {
            row.addEventListener('click', () => this.openTradeModal(row.dataset.id));
        });
    }

    renderNews(newsList) {
        if (!this.newsListContainer) return;
        this.newsListContainer.innerHTML = newsList.map(n => `
            <div class="news-card">
                <div class="news-header">
                    <span class="news-type-tag ${n.type === '찌라시' ? 'type-rumor' : 'type-news'}">${n.type}</span>
                    <span class="news-time">${n.time}</span>
                </div>
                <div class="news-title">${n.title}</div>
                <div class="news-content">${n.content}</div>
                <div class="news-footer">
                    <span class="impact-tag ${n.isPositive ? 'gainer' : 'loser'}">예상 파급력: ${n.impact}</span>
                    <button class="news-trade-link" data-id="${n.stockId}">차트 보기 및 거래 ➔</button>
                </div>
            </div>
        `).join('');

        this.newsListContainer.querySelectorAll('.news-trade-link').forEach(btn => {
            btn.addEventListener('click', () => this.openTradeModal(btn.dataset.id));
        });
    }

    renderPortfolio(portfolio) {
        if (!this.portfolioListContainer) return;
        if (portfolio.length === 0) {
            this.portfolioListContainer.innerHTML = `<div class="item-desc" style="text-align:center; padding:20px;">보유 중인 주식이 없습니다.</div>`;
            return;
        }

        this.portfolioListContainer.innerHTML = portfolio.map(item => {
            const isPos = item.profitLoss >= 0;
            return `
                <div class="portfolio-item">
                    <div>
                        <div class="port-stock-name">${item.stock.name} (${item.id})</div>
                        <div class="port-stock-sub">보유: ${item.qty}주 • 매수가: ${item.avgPrice.toLocaleString()}G</div>
                    </div>
                    <div class="port-right">
                        <div class="port-val">${item.currentVal.toLocaleString()}G</div>
                        <div class="port-pl ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '+' : ''}${item.profitLoss.toLocaleString()}G (${isPos ? '+' : ''}${item.profitLossPct.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showSettlementModal() {
        const state = marketEngine.getState();
        const finalRemain = state.totalNetWorth - state.targetRent;
        const isSuccess = finalRemain >= 0;

        if (this.settleCash) this.settleCash.textContent = `${state.cash.toLocaleString()} G`;
        if (this.settlePortfolio) this.settlePortfolio.textContent = `${state.portfolioValue.toLocaleString()} G`;
        if (this.settleTotalWorth) this.settleTotalWorth.textContent = `${state.totalNetWorth.toLocaleString()} G`;
        if (this.settleRentDeduction) this.settleRentDeduction.textContent = `-${state.targetRent.toLocaleString()} G`;
        if (this.settleFinalRemain) this.settleFinalRemain.textContent = `${finalRemain.toLocaleString()} G`;

        if (this.resultStamp) {
            this.resultStamp.textContent = isSuccess ? 'SUCCESS' : 'BANKRUPT';
            this.resultStamp.style.color = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
            this.resultStamp.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
        }

        if (this.resultGrade) {
            let grade = 'Grade B';
            if (finalRemain >= 10000) grade = 'Grade S+ (최고 성과)';
            else if (finalRemain >= 5000) grade = 'Grade S (우수 성과)';
            else if (finalRemain >= 2000) grade = 'Grade A (안정적)';
            else if (!isSuccess) grade = 'Grade F (조기 파산)';

            this.resultGrade.textContent = grade;
            this.resultGrade.style.color = isSuccess ? 'var(--accent-yellow)' : 'var(--accent-red)';
        }

        this.settlementModal.classList.remove('hidden');
    }

    showToast(message, isSuccess = true) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
        toast.textContent = message;

        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        }
    }
}

// Instantiate App when DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.stockWarsApp = new StockWarsApp();
});
