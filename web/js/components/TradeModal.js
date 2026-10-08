/**
 * TradeModal Component
 * Unity equivalent: UITradeModal.cs / StockOrderController.cs
 * Renders the Stock Trading Modal with interactive Chart, 5-tier Orderbook,
 * Long/Short order types, Leverage selector (1x-5x), and Company Info panel.
 */

import { SECTORS } from '../data/stocksData.js?v=v72';
import { chartPeriod } from '../engine/ChartTimeframes.js';
import { StockChartRenderer } from './chart.js';
import { getTradeModalHtml } from './trade/TradeModalTemplate.js';

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
        this.container.insertAdjacentHTML('beforeend', getTradeModalHtml());
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
        this.orderTypeInput = document.getElementById('tradeOrderType');
        this.limitPriceInput = document.getElementById('tradeLimitPrice');
        this.pendingOrdersElement = document.getElementById('tradePendingOrders');
        this.btnBuyExecute = document.getElementById('btnBuyExecute');
        this.btnSellExecute = document.getElementById('btnSellExecute');
        this.btnSellExecute?.parentElement?.insertAdjacentHTML('beforebegin', '<p id="sellOrderPreview" aria-live="polite"></p>');
        this.sellOrderPreview = document.getElementById('sellOrderPreview');

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
        this.orderTypeInput.addEventListener('change', () => {
            this.limitPriceInput.disabled = this.orderTypeInput.value !== 'limit';
            if (!this.limitPriceInput.value) this.limitPriceInput.value = this.callbacks.getStock?.(this.selectedStockId)?.price || '';
            this.updateCalculations();
        });
        this.limitPriceInput.addEventListener('input', () => this.updateCalculations());
        this.orderbookRows?.addEventListener('click', (e) => {
            const row = e.target.closest('button[data-price]');
            if (!row || !this.orderbookRows.contains(row)) return;
            const price = Number(row.dataset.price);
            if (!Number.isFinite(price) || price <= 0) return;
            this.orderTypeInput.value = 'limit';
            this.limitPriceInput.disabled = false;
            this.limitPriceInput.value = String(price);
            this.updateCalculations();
        });
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
            if (this.callbacks.isLevel10Unlocked && !this.callbacks.isLevel10Unlocked()) {
                if (this.callbacks.onShowToast) {
                    this.callbacks.onShowToast('🔒 공매도 기능은 레벨 10 해금 후 이용 가능합니다!', false);
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
                if (lev >= 2 && this.callbacks.isLevel10Unlocked && !this.callbacks.isLevel10Unlocked()) {
                    if (this.callbacks.onShowToast) {
                        this.callbacks.onShowToast(`🔒 ${lev}x 고배율 레버리지는 레벨 10 해금 후 이용 가능합니다!`, false);
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
                        this.tradeQty = this.callbacks.getMaxQty(this.selectedStockId, this.selectedLeverage, this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) : null, this.isShortMode);
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
                    this.callbacks.onShort(this.selectedStockId, this.tradeQty, this.selectedLeverage, this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) : null);
                }
            } else {
                if (this.callbacks.onBuy) {
                    this.callbacks.onBuy(this.selectedStockId, this.tradeQty, this.selectedLeverage, this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) : null);
                }
            }
        });

        this.btnSellExecute?.addEventListener('click', () => {
            if (this.callbacks.onSell) {
                this.callbacks.onSell(this.selectedStockId, this.tradeQty, this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) : null);
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
        this.orderTypeInput.value = 'market'; this.limitPriceInput.value = ''; this.limitPriceInput.disabled = true;
        if (this.tradeQtyInput) this.tradeQtyInput.value = 1;
        this.modal?.classList.remove('hidden');
        this.updateContent();
    }

    close() {
        const wasOpen = this.isOpen();
        this.modal?.classList.add('hidden');
        if (wasOpen) this.callbacks.onClose?.();
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

        // Level 10 unlock UI reflection
        const isUnlocked = this.callbacks.isLevel10Unlocked ? this.callbacks.isLevel10Unlocked() : false;
        if (this.btnOrderTypeShort) {
            this.btnOrderTypeShort.classList.toggle('locked', !isUnlocked);
        }
        if (this.shortLockTag) {
            this.shortLockTag.style.display = isUnlocked ? 'none' : 'inline-block';
        }
        if (this.lev3Btn) this.lev3Btn.classList.toggle('locked', !isUnlocked);
        if (this.lev5Btn) this.lev5Btn.classList.toggle('locked', !isUnlocked);

        this.modal.querySelectorAll('.lev-btn').forEach(btn=>btn.classList.toggle('locked',Number(btn.dataset.lev)>=2&&!isUnlocked));
        if(!isUnlocked){this.selectedLeverage=1;this.isShortMode=false;}
        // Chart
        if (this.chartRenderer && this.callbacks.getChartHistory) {
            const selected = chartPeriod(this.callbacks.getChartHistory(this.selectedStockId), 'LIVE');
            const samples = selected.samples;
            this.chartRenderer.render(samples.map(p => p.price),
                samples.length > 0 && samples.at(-1).price >= samples[0].price,
                samples.map((p, index) => index));
        } else if (this.chartRenderer && this.callbacks.getPriceHistory) {
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

        const pending = this.callbacks.getPendingOrders?.(this.selectedStockId) || [];
        this.pendingOrdersElement.replaceChildren();
        for (const order of pending) {
            const row = document.createElement('div');
            row.className = 'pending-order-row';
            const description = document.createElement('span');
            description.className = 'pending-order-description';
            description.textContent = (order.side === 'buy' ? '매수' : order.side === 'sell' ? '매도' : '공매도') + ' ' + order.qty + '주 · ' + order.price.toLocaleString() + 'G 대기';
            const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '취소';
            cancel.className = 'pending-order-cancel';
            cancel.setAttribute('aria-label', description.textContent + ' 주문 취소');
            cancel.onclick = () => { this.callbacks.onCancelOrder?.(order.id); this.updateContent(); };
            row.append(description, cancel); this.pendingOrdersElement.append(row);
        }
        this.updateCalculations();
    }

    renderOrderbook(ob) {
        if (!this.orderbookRows) return;
        let html = '';

        ob.asks.forEach(item => {
            html += `
                <button type="button" class="ob-row ask" data-price="${item.price}" aria-label="${item.price.toLocaleString()} Gold 지정가 선택">
                    <span class="ob-fill" style="width: ${item.pct}%;"></span>
                    <span class="ob-price">${item.price.toLocaleString()}</span>
                    <span class="ob-vol">${item.vol}</span>
                </button>
            `;
        });

        ob.bids.forEach(item => {
            html += `
                <button type="button" class="ob-row bid" data-price="${item.price}" aria-label="${item.price.toLocaleString()} Gold 지정가 선택">
                    <span class="ob-fill" style="width: ${item.pct}%;"></span>
                    <span class="ob-price">${item.price.toLocaleString()}</span>
                    <span class="ob-vol">${item.vol}</span>
                </button>
            `;
        });

        this.orderbookRows.innerHTML = html;
    }

    updateCalculations() {
        const tutorialError = this.callbacks.getTutorialOrderError?.(this.selectedStockId, this.isShortMode);
        if (this.btnBuyExecute) {
            this.btnBuyExecute.disabled = !!tutorialError;
            this.btnBuyExecute.title = tutorialError || '';
            this.btnBuyExecute.textContent = tutorialError ? '안나 추천 종목을 선택해 주세요' : this.isShortMode ? '공매도 진입 (SHORT)' : '매수 (BUY)';
        }
        const preview = this.callbacks.getSellPreview?.(this.selectedStockId, this.tradeQty, this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) : null);
        if (this.sellOrderPreview && preview) {
            this.sellOrderPreview.textContent = preview.quantity > 0
                ? `매도 예상: ${preview.quantity}주 · 수령 ${preview.proceeds.toLocaleString()}G · 실현 손익 ${preview.profit >= 0 ? '+' : ''}${preview.profit.toLocaleString()}G (체결 시 시세에 따라 변동)`
                : '현재 체결 가능한 매도 물량이 없습니다.';
        }
        if (!this.callbacks.getStock) return;
        const stock = this.callbacks.getStock(this.selectedStockId);
        if (stock && this.modalTotalCost) {
            const totalMargin = Math.round(((this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) || 0 : stock.price) * this.tradeQty) / this.selectedLeverage);
            const modeStr = this.isShortMode ? '공매도' : '현물 매수';
            const price = this.orderTypeInput.value === 'limit' ? Number(this.limitPriceInput.value) || 0 : stock.price;
            const execution = this.orderTypeInput.value === 'market' ? this.callbacks.getExecutionPreview?.(this.isShortMode ? 'short' : 'buy', this.selectedStockId, this.tradeQty, this.selectedLeverage) : null;
            const quote = execution || this.callbacks.getOrderQuote?.(price, this.tradeQty, this.selectedLeverage);
            this.modalTotalCost.textContent = `${(quote?.total ?? totalMargin).toLocaleString()} Gold (${modeStr} ${this.selectedLeverage}x)` + (quote ? ` · 수수료 ${quote.fee.toLocaleString()}G (${(quote.feeRate * 100).toFixed(3)}%) 포함` : '') + (execution ? ` · 예상 ${execution.quantity}/${this.tradeQty}주 · 평균 ${execution.averagePrice.toLocaleString(undefined,{maximumFractionDigits:2})}G${execution.remaining ? ' · 잔량 취소' : ''}` : '');
        }
    }
}

