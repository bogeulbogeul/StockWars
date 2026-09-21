/**
 * TradeModal Component
 * Unity equivalent: UITradeModal.cs / StockOrderController.cs
 * Renders the Stock Trading Modal with interactive Chart, 5-tier Orderbook,
 * Long/Short order types, Leverage selector (1x-5x), and Company Info panel.
 */

import { SECTORS } from '../data/stocksData.js';
import { StockChartRenderer } from './chart.js';

export class TradeModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.selectedStockId = 'CLOUDBERRY';
        this.tradeQty = 1;
        this.selectedLeverage = 1;
        this.isShortMode = false;
        this.chartRenderer = null;
        this.activeSubtab = 'Chart';

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="tradeModal" class="modal-overlay hidden">
                <div class="modal-card">
                    <div class="modal-header">
                        <div class="modal-stock-title">
                            <span id="modalStockName" class="stock-name">클라우드 베리</span>
                            <button class="fav-btn" id="btnFavoriteStock" title="관심 종목 토글">⭐</button>
                            <span id="modalStockCode" class="stock-code">CLOUDBERRY</span>
                            <span id="modalStockSector" class="stock-sector-badge">IT</span>
                        </div>
                        <button class="modal-close-btn" id="btnCloseTradeModal">✕</button>
                    </div>

                    <!-- Sub Navigation Tabs inside Trade Modal -->
                    <div class="trade-modal-subtabs">
                        <button class="subtab-btn active" id="btnSubtabChart">📊 차트 & 호가</button>
                        <button class="subtab-btn" id="btnSubtabInfo">ℹ️ 기업 정보 (Info)</button>
                    </div>

                    <div class="modal-body">
                        <!-- Stock Price Header -->
                        <div class="modal-price-header">
                            <div class="current-price" id="modalStockPrice">850 Gold</div>
                            <div class="price-change-tag" id="modalStockChange">+2.4%</div>
                        </div>

                        <!-- SUBTAB 1: CHART & ORDERBOOK CONTENT -->
                        <div id="tradeSubtabChartContent" class="subtab-content active">
                            <!-- Canvas Stock Chart -->
                            <div class="chart-container clickable-chart" id="btnExpandChart" title="클릭하여 전체화면 정밀 차트 열기">
                                <canvas id="stockCanvasChart"></canvas>
                            </div>

                            <!-- 5-Tier Orderbook & Buy/Sell Panel Grid -->
                            <div class="trade-grid">
                                <!-- Left: Orderbook -->
                                <div class="orderbook-panel">
                                    <div class="panel-lbl">실시간 호가창</div>
                                    <div class="orderbook-rows" id="orderbookRows">
                                        <!-- Populated dynamically -->
                                    </div>
                                </div>

                                <!-- Right: Trade Form Panel -->
                                <div class="trade-form-panel">
                                    <!-- Order Type Selector (Long vs Short) -->
                                    <div class="order-type-selector">
                                        <button class="order-type-btn active" id="btnOrderTypeLong">📈 현물 매수 (Long)</button>
                                        <button class="order-type-btn locked" id="btnOrderTypeShort">
                                            📉 공매도 (Short) <span class="lock-tag" id="shortLockTag">🔒 Lv.20</span>
                                        </button>
                                    </div>

                                    <!-- Leverage Selector -->
                                    <div class="leverage-selector">
                                        <span class="panel-lbl">마진 레버리지</span>
                                        <div class="leverage-btn-group">
                                            <button class="lev-btn active" data-lev="1">1x</button>
                                            <button class="lev-btn" data-lev="2">2x</button>
                                            <button class="lev-btn locked" data-lev="3" id="lev3Btn">3x <span class="lock-tag">🔒</span></button>
                                            <button class="lev-btn locked" data-lev="5" id="lev5Btn">5x <span class="lock-tag">🔒</span></button>
                                        </div>
                                    </div>

                                    <div class="qty-selector">
                                        <span class="qty-lbl">수량</span>
                                        <div class="qty-input-group">
                                            <button class="qty-btn" id="btnQtyMinus">-</button>
                                            <input type="number" id="tradeQtyInput" value="1" min="1" max="9999">
                                            <button class="qty-btn" id="btnQtyPlus">+</button>
                                        </div>
                                    </div>

                                    <div class="quick-qty-btns">
                                        <button class="q-btn" data-qty="1">1주</button>
                                        <button class="q-btn" data-qty="5">5주</button>
                                        <button class="q-btn" data-qty="10">10주</button>
                                        <button class="q-btn" data-qty="MAX" id="btnQtyMax">MAX</button>
                                    </div>

                                    <div class="total-calc-box">
                                        <span>총 주문 금액 (증거금):</span>
                                        <span class="total-gold" id="modalTotalCost">850G</span>
                                    </div>

                                    <div class="order-action-btns">
                                        <button class="trade-action-btn buy-btn" id="btnBuyExecute">매수 (BUY)</button>
                                        <button class="trade-action-btn sell-btn" id="btnSellExecute">매도 (SELL)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SUBTAB 2: STOCK INFO CONTENT -->
                        <div id="tradeSubtabInfoContent" class="subtab-content hidden">
                            <div class="info-section">
                                <div class="info-section-title">🏢 기업 개요 (Company Overview)</div>
                                <div class="info-rich-desc" id="infoRichDesc">
                                    기업 설명이 로드되는 중입니다...
                                </div>
                            </div>

                            <div class="info-section">
                                <div class="info-section-title">📊 핵심 투자 지표 & 재무 통계</div>
                                <div class="info-stats-grid">
                                    <div class="info-stat-card">
                                        <span class="stat-name">PER (주가수익비율)</span>
                                        <span class="stat-val-num" id="infoPER">14.2 배</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">PBR (주가순자산비율)</span>
                                        <span class="stat-val-num" id="infoPBR">1.8 배</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">ROE (자기자본이익률)</span>
                                        <span class="stat-val-num" id="infoROE">12.7 %</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">주간 배당률</span>
                                        <span class="stat-val-num" id="infoDividend">3.0 %</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">시가총액 (Market Cap)</span>
                                        <span class="stat-val-num" id="infoMarketCap">8,500억G</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">52주 최고 / 최저</span>
                                        <span class="stat-val-num" id="infoHighLow">920G / 780G</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">위험도 등급 (Risk)</span>
                                        <span class="stat-val-num" id="infoRisk">Low</span>
                                    </div>
                                    <div class="info-stat-card">
                                        <span class="stat-name">변동성 티어 (Tier)</span>
                                        <span class="stat-val-num" id="infoTier">Tier C</span>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <div class="info-section-title">📰 관련 공시 & 공식 뉴스</div>
                                <div class="related-news-list" id="infoRelatedNews">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('tradeModal');
        this.btnClose = document.getElementById('btnCloseTradeModal');
        this.btnFavorite = document.getElementById('btnFavoriteStock');
        this.modalStockName = document.getElementById('modalStockName');
        this.modalStockCode = document.getElementById('modalStockCode');
        this.modalStockSector = document.getElementById('modalStockSector');
        this.modalStockPrice = document.getElementById('modalStockPrice');
        this.modalStockChange = document.getElementById('modalStockChange');

        this.btnSubtabChart = document.getElementById('btnSubtabChart');
        this.btnSubtabInfo = document.getElementById('btnSubtabInfo');
        this.subtabChartContent = document.getElementById('tradeSubtabChartContent');
        this.subtabInfoContent = document.getElementById('tradeSubtabInfoContent');

        this.btnExpandChart = document.getElementById('btnExpandChart');
        this.stockCanvasChart = document.getElementById('stockCanvasChart');
        this.orderbookRows = document.getElementById('orderbookRows');

        this.btnOrderTypeLong = document.getElementById('btnOrderTypeLong');
        this.btnOrderTypeShort = document.getElementById('btnOrderTypeShort');
        this.shortLockTag = document.getElementById('shortLockTag');
        this.lev3Btn = document.getElementById('lev3Btn');
        this.lev5Btn = document.getElementById('lev5Btn');

        this.tradeQtyInput = document.getElementById('tradeQtyInput');
        this.btnQtyMinus = document.getElementById('btnQtyMinus');
        this.btnQtyPlus = document.getElementById('btnQtyPlus');
        this.btnQtyMax = document.getElementById('btnQtyMax');
        this.modalTotalCost = document.getElementById('modalTotalCost');
        this.btnBuyExecute = document.getElementById('btnBuyExecute');
        this.btnSellExecute = document.getElementById('btnSellExecute');

        // Info Tab DOM
        this.infoRichDesc = document.getElementById('infoRichDesc');
        this.infoPER = document.getElementById('infoPER');
        this.infoPBR = document.getElementById('infoPBR');
        this.infoROE = document.getElementById('infoROE');
        this.infoDividend = document.getElementById('infoDividend');
        this.infoMarketCap = document.getElementById('infoMarketCap');
        this.infoHighLow = document.getElementById('infoHighLow');
        this.infoRisk = document.getElementById('infoRisk');
        this.infoTier = document.getElementById('infoTier');
        this.infoRelatedNews = document.getElementById('infoRelatedNews');

        if (this.stockCanvasChart) {
            this.chartRenderer = new StockChartRenderer(this.stockCanvasChart);
        }
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        this.btnFavorite?.addEventListener('click', () => {
            if (this.callbacks.onToggleFavorite) {
                this.callbacks.onToggleFavorite(this.selectedStockId);
            }
        });

        // Subtabs
        this.btnSubtabChart?.addEventListener('click', () => this.switchSubtab('Chart'));
        this.btnSubtabInfo?.addEventListener('click', () => this.switchSubtab('Info'));

        // Expand Chart
        this.btnExpandChart?.addEventListener('click', () => {
            if (this.callbacks.onOpenDetailedChart) {
                this.callbacks.onOpenDetailedChart(this.selectedStockId);
            }
        });

        // Order Type (Long / Short)
        this.btnOrderTypeLong?.addEventListener('click', () => {
            this.isShortMode = false;
            this.btnOrderTypeLong.classList.add('active');
            this.btnOrderTypeShort.classList.remove('active');
            this.btnBuyExecute.textContent = '매수 (BUY)';
            this.updateCalculations();
        });

        this.btnOrderTypeShort?.addEventListener('click', () => {
            if (this.callbacks.isLevel20Unlocked && !this.callbacks.isLevel20Unlocked()) {
                if (this.callbacks.onShowToast) {
                    this.callbacks.onShowToast('🔒 공매도 기능은 레벨 20 해금 후 이용 가능합니다!', false);
                }
                return;
            }
            this.isShortMode = true;
            this.btnOrderTypeShort.classList.add('active');
            this.btnOrderTypeLong.classList.remove('active');
            this.btnBuyExecute.textContent = '공매도 진입 (SHORT)';
            this.updateCalculations();
        });

        // Leverage Buttons
        document.querySelectorAll('.lev-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lev = parseInt(btn.dataset.lev) || 1;
                if (lev >= 3 && this.callbacks.isLevel20Unlocked && !this.callbacks.isLevel20Unlocked()) {
                    if (this.callbacks.onShowToast) {
                        this.callbacks.onShowToast(`🔒 ${lev}x 고배율 레버리지는 레벨 20 해금 후 이용 가능합니다!`, false);
                    }
                    return;
                }
                document.querySelectorAll('.lev-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedLeverage = lev;
                this.updateCalculations();
            });
        });

        // Qty Buttons
        this.btnQtyMinus?.addEventListener('click', () => {
            this.tradeQty = Math.max(1, this.tradeQty - 1);
            if (this.tradeQtyInput) this.tradeQtyInput.value = this.tradeQty;
            this.updateCalculations();
        });

        this.btnQtyPlus?.addEventListener('click', () => {
            this.tradeQty += 1;
            if (this.tradeQtyInput) this.tradeQtyInput.value = this.tradeQty;
            this.updateCalculations();
        });

        this.tradeQtyInput?.addEventListener('input', (e) => {
            this.tradeQty = Math.max(1, parseInt(e.target.value) || 1);
            this.updateCalculations();
        });

        document.querySelectorAll('.q-btn').forEach(b => {
            b.addEventListener('click', () => {
                const val = b.dataset.qty;
                if (val === 'MAX') {
                    if (this.callbacks.getMaxQty) {
                        this.tradeQty = this.callbacks.getMaxQty(this.selectedStockId, this.selectedLeverage);
                    }
                } else {
                    this.tradeQty = parseInt(val) || 1;
                }
                if (this.tradeQtyInput) this.tradeQtyInput.value = this.tradeQty;
                this.updateCalculations();
            });
        });

        // Order Execution
        this.btnBuyExecute?.addEventListener('click', () => {
            if (this.isShortMode) {
                if (this.callbacks.onShort) {
                    this.callbacks.onShort(this.selectedStockId, this.tradeQty, this.selectedLeverage);
                }
            } else {
                if (this.callbacks.onBuy) {
                    this.callbacks.onBuy(this.selectedStockId, this.tradeQty, this.selectedLeverage);
                }
            }
        });

        this.btnSellExecute?.addEventListener('click', () => {
            if (this.callbacks.onSell) {
                this.callbacks.onSell(this.selectedStockId, this.tradeQty);
            }
        });
    }

    switchSubtab(tabName) {
        this.activeSubtab = tabName;
        if (tabName === 'Chart') {
            this.btnSubtabChart?.classList.add('active');
            this.btnSubtabInfo?.classList.remove('active');
            this.subtabChartContent?.classList.remove('hidden');
            this.subtabChartContent?.classList.add('active');
            this.subtabInfoContent?.classList.add('hidden');
            this.subtabInfoContent?.classList.remove('active');
        } else {
            this.btnSubtabInfo?.classList.add('active');
            this.btnSubtabChart?.classList.remove('active');
            this.subtabInfoContent?.classList.remove('hidden');
            this.subtabInfoContent?.classList.add('active');
            this.subtabChartContent?.classList.add('hidden');
            this.subtabChartContent?.classList.remove('active');
        }
    }

    open(stockId) {
        this.selectedStockId = stockId || 'CLOUDBERRY';
        this.tradeQty = 1;
        if (this.tradeQtyInput) this.tradeQtyInput.value = 1;
        this.modal?.classList.remove('hidden');
        this.updateContent();
    }

    close() {
        this.modal?.classList.add('hidden');
    }

    isOpen() {
        return this.modal && !this.modal.classList.contains('hidden');
    }

    updateContent() {
        if (!this.callbacks.getStock) return;
        const stock = this.callbacks.getStock(this.selectedStockId);
        if (!stock) return;

        const diff = stock.price - stock.prevPrice;
        const diffPct = stock.prevPrice > 0 ? (diff / stock.prevPrice) * 100 : 0;
        const isPos = diff >= 0;

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
            this.modalStockChange.textContent = `${isPos ? '+' : ''}${diffPct.toFixed(2)}% (${diff > 0 ? '+' : ''}${diff}G)`;
            this.modalStockChange.className = `price-change-tag ${isPos ? 'gainer' : 'loser'}`;
        }

        // Favorite star state
        if (this.btnFavorite && this.callbacks.isFavorite) {
            const isFav = this.callbacks.isFavorite(this.selectedStockId);
            this.btnFavorite.classList.toggle('active', isFav);
        }

        // Level 20 unlock UI reflection
        const isUnlocked = this.callbacks.isLevel20Unlocked ? this.callbacks.isLevel20Unlocked() : false;
        if (this.btnOrderTypeShort) {
            this.btnOrderTypeShort.classList.toggle('locked', !isUnlocked);
        }
        if (this.shortLockTag) {
            this.shortLockTag.style.display = isUnlocked ? 'none' : 'inline-block';
        }
        if (this.lev3Btn) this.lev3Btn.classList.toggle('locked', !isUnlocked);
        if (this.lev5Btn) this.lev5Btn.classList.toggle('locked', !isUnlocked);

        // Chart
        if (this.chartRenderer && this.callbacks.getPriceHistory) {
            const hist = this.callbacks.getPriceHistory(this.selectedStockId) || [stock.price];
            this.chartRenderer.render(hist, isPos);
        }

        // Orderbook
        if (this.callbacks.getOrderBook) {
            const ob = this.callbacks.getOrderBook(this.selectedStockId);
            this.renderOrderbook(ob);
        }

        // Company Info Panel
        if (this.infoRichDesc) this.infoRichDesc.textContent = stock.richDesc || stock.desc;
        if (this.infoPER) this.infoPER.textContent = `${stock.per || 14.2} 배`;
        if (this.infoPBR) this.infoPBR.textContent = `${stock.pbr || 1.8} 배`;
        if (this.infoROE) this.infoROE.textContent = `${stock.roe || 12.7} %`;
        if (this.infoDividend) this.infoDividend.textContent = `${((stock.dividend || 0.03) * 100).toFixed(1)} %`;
        if (this.infoMarketCap) this.infoMarketCap.textContent = stock.marketCap || '8,500억G';
        if (this.infoHighLow) this.infoHighLow.textContent = `${(stock.high52 || stock.price * 1.1).toLocaleString()}G / ${(stock.low52 || stock.price * 0.9).toLocaleString()}G`;
        if (this.infoRisk) this.infoRisk.textContent = stock.risk || 'Low';
        if (this.infoTier) this.infoTier.textContent = `Tier ${stock.tier || 'C'}`;

        // Related News (Official News & Disclosures only)
        if (this.infoRelatedNews && this.callbacks.getNews) {
            const allNews = this.callbacks.getNews();
            const related = allNews.filter(n => n.stockId === this.selectedStockId && n.type !== '찌라시');
            if (related.length === 0) {
                this.infoRelatedNews.innerHTML = `<div class="item-desc" style="padding:10px; text-align:center;">최근 노출된 관련 공식 뉴스가 없습니다.</div>`;
            } else {
                this.infoRelatedNews.innerHTML = related.map(n => `
                    <div class="news-card" data-news-id="${n.id}">
                        <div class="news-header">
                            <span class="news-type-tag ${n.type === '공시' ? 'type-disclosure' : 'type-news'}">${n.type}</span>
                            <span class="news-time">${n.time}</span>
                        </div>
                        <div class="news-title">${n.title}</div>
                    </div>
                `).join('');

                this.infoRelatedNews.querySelectorAll('.news-card').forEach(c => {
                    c.addEventListener('click', () => {
                        if (this.callbacks.onOpenNewsDetailModal) {
                            this.callbacks.onOpenNewsDetailModal(c.dataset.newsId);
                        }
                    });
                });
            }
        }

        this.updateCalculations();
    }

    renderOrderbook(ob) {
        if (!this.orderbookRows) return;
        let html = '';

        ob.asks.forEach(item => {
            html += `
                <div class="ob-row ask">
                    <div class="ob-fill" style="width: ${item.pct}%;"></div>
                    <span class="ob-price">${item.price.toLocaleString()}</span>
                    <span class="ob-vol">${item.vol}</span>
                </div>
            `;
        });

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

    updateCalculations() {
        if (!this.callbacks.getStock) return;
        const stock = this.callbacks.getStock(this.selectedStockId);
        if (stock && this.modalTotalCost) {
            const totalMargin = Math.round((stock.price * this.tradeQty) / this.selectedLeverage);
            const modeStr = this.isShortMode ? '공매도' : '현물 매수';
            this.modalTotalCost.textContent = `${totalMargin.toLocaleString()} Gold (${modeStr} ${this.selectedLeverage}x)`;
        }
    }
}
