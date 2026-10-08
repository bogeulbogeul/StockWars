import { chartPeriod, chartTimeLabel, createChartHistory, chartPriceRange } from '../engine/ChartTimeframes.js';
import '../app/GameViewport.js';
import { nearestChartPoint, chartViewportRect } from './chart/ChartPointer.js';
/**
 * DetailedChartModal Component
 * Unity equivalent: UIDetailedChartModal.cs
 * Full-screen expanded horizontal scrollable canvas stock chart with crosshair tooltips.
 */

import { SECTORS } from '../data/stocksData.js?v=v72';

export class DetailedChartModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.selectedStockId = 'CLOUDBERRY';
        this.selectedTimeframe = 'LIVE';
        this.points = [];
        this.fallbackHistory = new Map();

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="detailedChartModal" class="modal-overlay hidden">
                <div class="modal-card detailed-chart-card">
                    <div class="modal-header">
                        <div class="modal-header-left">
                            <span id="detailedModalDate" class="detail-header-date">2026/09/14</span>
                            <div class="modal-stock-title">
                                <span id="detailedModalStockName" class="stock-name">클라우드 베리</span>
                                <span id="detailedModalStockCode" class="stock-code">CLOUDBERRY</span>
                                <span id="detailedModalStockSector" class="stock-sector-badge">IT</span>
                            </div>
                        </div>
                        <button class="modal-close-btn" id="btnCloseDetailedChartModal">✕</button>
                    </div>

                    <div class="detailed-header-price-row">
                        <div class="detail-price-box">
                            <span class="detail-price-val" id="detailedModalPrice">0 Gold</span>
                            <span class="detail-price-change" id="detailedModalChange">+0.0% (+0G)</span>
                        </div>
                        <div class="detail-metrics-grid">
                            <div class="metric-chip">
                                <span class="lbl">최고가</span>
                                <span class="val gainer" id="detailedModalHigh">0G</span>
                            </div>
                            <div class="metric-chip">
                                <span class="lbl">최저가</span>
                                <span class="val loser" id="detailedModalLow">0G</span>
                            </div>
                            <div class="metric-chip">
                                <span class="lbl">평균가</span>
                                <span class="val" id="detailedModalAvg">0G</span>
                            </div>
                        </div>
                    </div>

                    <p class="chart-color-guide">미국 시장 방식 · <span style="color:#00e5ff">▲ 상승</span> / <span style="color:#ff3b5c">▼ 하락</span></p>
                    <!-- Main Horizontal Scrollable Canvas Container -->
                    <div class="detailed-chart-scroll-wrapper" id="detailedChartScrollWrapper">
                        <div class="detailed-canvas-inner" id="detailedCanvasInner">
                            <canvas id="detailedCanvasChart" width="2800" height="320"></canvas>
                            <div id="chartCrosshairTooltip" class="chart-tooltip hidden">
                                <div class="tt-time" id="ttTime">N일차</div>
                                <div class="tt-price" id="ttPrice">0 G</div>
                                <div class="tt-change" id="ttChange">+0.0%</div>
                            </div>
                        </div>
                    </div>

                    <div class="scroll-navigation-hint">
                        <span>◀ 좌우 드래그/스크롤하여 00:00부터 현재 시각까지 당일 주가 흐름을 확인하세요 ▶</span>
                    </div>

                    <!-- Bottom Pill Controls: Timeframe (1D, 1W, 1M, 1Y) -->
                    <div class="chart-controls-bar bottom-controls">
                        <div class="timeframe-selector pill-selector" id="timeframeSelector">
                            <button class="tf-btn pill-btn active" data-tf="LIVE">실시간</button>
                            <button class="tf-btn pill-btn" data-tf="1D">1일</button>
                            <button class="tf-btn pill-btn" data-tf="1W">1주</button>
                            <button class="tf-btn pill-btn" data-tf="1M">1달</button>
                            <button class="tf-btn pill-btn" data-tf="1Y">1년</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('detailedChartModal');
        this.btnClose = document.getElementById('btnCloseDetailedChartModal');
        this.modalDate = document.getElementById('detailedModalDate');
        this.modalStockName = document.getElementById('detailedModalStockName');
        this.modalStockCode = document.getElementById('detailedModalStockCode');
        this.modalStockSector = document.getElementById('detailedModalStockSector');

        this.modalPrice = document.getElementById('detailedModalPrice');
        this.modalChange = document.getElementById('detailedModalChange');
        this.modalHigh = document.getElementById('detailedModalHigh');
        this.modalLow = document.getElementById('detailedModalLow');
        this.modalAvg = document.getElementById('detailedModalAvg');

        this.scrollWrapper = document.getElementById('detailedChartScrollWrapper');
        this.canvas = document.getElementById('detailedCanvasChart');
        this.tooltip = document.getElementById('chartCrosshairTooltip');
        this.ttTime = document.getElementById('ttTime');
        this.ttPrice = document.getElementById('ttPrice');
        this.ttChange = document.getElementById('ttChange');
        this.crosshair = document.createElement('div');
        this.crosshair.className = 'detail-chart-crosshair hidden';
        this.crosshair.innerHTML = '<span class="chart-guide-vertical"></span><span class="chart-guide-horizontal"></span><span class="chart-guide-point"></span>';
        this.canvas.parentElement.append(this.crosshair);
        this.guideVertical = this.crosshair.querySelector('.chart-guide-vertical');
        this.guideHorizontal = this.crosshair.querySelector('.chart-guide-horizontal');
        this.guidePoint = this.crosshair.querySelector('.chart-guide-point');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        window.addEventListener('resize', () => {
            if (!this.modal?.classList.contains('hidden')) this.renderCanvasChart();
        });

        // Timeframe selector
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTimeframe = btn.dataset.tf;
                this.renderCanvasChart();
            });
        });

        // Scroll first, then resolve the guide against the final canvas position.
        // Pointer events avoid competing native touch scrolling and mouse handlers.
        const wrapper = this.scrollWrapper;
        if (!wrapper || !this.canvas) return;
        let drag = null;
        wrapper.addEventListener('pointerdown', e => {
            if (!e.isPrimary || e.button !== 0) return;
            const rect = chartViewportRect(wrapper);
            const scale = rect.width / wrapper.offsetWidth;
            if (e.clientY >= rect.top + (wrapper.clientTop + wrapper.clientHeight) * scale) return;
            drag = { id: e.pointerId, x: e.clientX, scrollLeft: wrapper.scrollLeft, scale: scale };
            wrapper.setPointerCapture(e.pointerId);
            wrapper.classList.add('active-drag');
            this.queueChartHover(e);
        });
        wrapper.addEventListener('pointermove', e => {
            if (!e.isPrimary) return;
            if (drag?.id === e.pointerId) {
                wrapper.scrollLeft = drag.scrollLeft - (e.clientX - drag.x) / drag.scale;
            }
            this.queueChartHover(e);
        });
        const endDrag = e => {
            if (drag?.id !== e.pointerId) return;
            drag = null;
            wrapper.classList.remove('active-drag');
            if (wrapper.hasPointerCapture(e.pointerId)) wrapper.releasePointerCapture(e.pointerId);
            if (e.type === 'pointercancel' || e.pointerType === 'touch') this.clearChartPointer();
            else this.queueChartHover(e);
        };
        wrapper.addEventListener('pointerup', endDrag);
        wrapper.addEventListener('pointercancel', endDrag);
        wrapper.addEventListener('lostpointercapture', () => {
            drag = null;
            wrapper.classList.remove('active-drag');
        });
        wrapper.addEventListener('scroll', () => {
            if (this.lastChartPointer) this.queueChartHover(this.lastChartPointer);
        });
        wrapper.addEventListener('pointerleave', () => {
            if (!drag) this.clearChartPointer();
        });
    }

    queueChartHover({ clientX, clientY }) {
        this.lastChartPointer = { clientX, clientY };
        if (this.hoverFrame != null) return;
        this.hoverFrame = requestAnimationFrame(() => {
            this.hoverFrame = null;
            if (this.lastChartPointer) this.handleChartHover(this.lastChartPointer);
        });
    }

    clearChartPointer() {
        if (this.hoverFrame != null) cancelAnimationFrame(this.hoverFrame);
        this.hoverFrame = null;
        this.lastChartPointer = null;
        this.hideCrosshair();
    }

    handleChartHover({ clientX, clientY }) {
        if (!this.points.length || !this.plotBounds) return;
        const view = chartViewportRect(this.scrollWrapper);
        if (clientX < view.left || clientX > view.right || clientY < view.top || clientY > view.bottom) {
            this.hideCrosshair();
            return;
        }
        const rect = chartViewportRect(this.canvas);
        if (!rect.width) return;
        const unitsPerPixel = this.chartWidth / rect.width;
        const mouseX = (clientX - rect.left) * unitsPerPixel;
        const closest = nearestChartPoint(this.points, mouseX, unitsPerPixel * 0.5);
        if (!closest || !this.tooltip) return;
        const plot = this.plotBounds;
        this.tooltip.classList.remove('hidden');
        this.crosshair.classList.remove('hidden');
        // Update text before measuring, so a wider date/price cannot overflow the viewport.
        if (this.ttTime) this.ttTime.textContent = closest.time || '시간';
        if (this.ttPrice) this.ttPrice.textContent = `${closest.price.toLocaleString()} G`;
        if (this.ttChange) {
            const isPos = closest.diffPct >= 0;
            this.ttChange.textContent = `${isPos ? '+' : ''}${closest.diffPct.toFixed(2)}%`;
            this.ttChange.className = `tt-change ${isPos ? 'gainer' : 'loser'}`;
        }
        const tooltipWidth = this.tooltip.offsetWidth;
        const tooltipHeight = this.tooltip.offsetHeight;
        const left = this.scrollWrapper.scrollLeft + 12;
        const right = Math.min(this.chartWidth, this.scrollWrapper.scrollLeft + this.scrollWrapper.clientWidth) - tooltipWidth - 12;
        Object.assign(this.guideVertical.style, { left: closest.x + 'px', top: plot.top + 'px', height: (plot.bottom - plot.top + 25) + 'px' });
        Object.assign(this.guideHorizontal.style, { left: plot.left + 'px', top: closest.y + 'px', width: (plot.right - plot.left) + 'px' });
        Object.assign(this.guidePoint.style, { left: closest.x + 'px', top: closest.y + 'px' });
        this.tooltip.style.left = Math.max(left, Math.min(right, closest.x + 16)) + 'px';
        this.tooltip.style.top = Math.max(8, closest.y - tooltipHeight - 16) + 'px';
    }

    open(stockId) {
        this.clearChartPointer();
        this.selectedStockId = stockId || 'CLOUDBERRY';
        this.selectedTimeframe = 'LIVE';
        this.modal?.querySelectorAll('.tf-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tf === 'LIVE'));
        this.modal?.classList.remove('hidden');
        this.updateContent();

        // Scroll to rightmost (most recent)
        if (this.scrollWrapper) this.scrollWrapper.scrollLeft = this.scrollWrapper.scrollWidth;
    }

    hideCrosshair() {
        this.tooltip?.classList.add('hidden');
        this.crosshair?.classList.add('hidden');
    }

    close() {
        this.clearChartPointer();
        this.modal?.classList.add('hidden');
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

        if (this.modalPrice) this.modalPrice.textContent = `${stock.price.toLocaleString()} Gold`;
        if (this.modalChange) {
            this.modalChange.textContent = `${isPos ? '+' : ''}${diffPct.toFixed(2)}% (${diff > 0 ? '+' : ''}${diff}G)`;
            this.modalChange.className = `detail-price-change ${isPos ? 'gainer' : 'loser'}`;
        }

        const hist = this.callbacks.getPriceHistory ? (this.callbacks.getPriceHistory(this.selectedStockId) || [stock.price]) : [stock.price];
        const max = Math.max(...hist);
        const min = Math.min(...hist);
        const avg = Math.round(hist.reduce((a, b) => a + b, 0) / hist.length);

        if (this.modalHigh) this.modalHigh.textContent = `${max.toLocaleString()}G`;
        if (this.modalLow) this.modalLow.textContent = `${min.toLocaleString()}G`;
        if (this.modalAvg) this.modalAvg.textContent = `${avg.toLocaleString()}G`;

        this.renderCanvasChart();
    }

    renderCanvasChart() {
        if (!this.canvas || !this.callbacks.getStock) return;
        const stock = this.callbacks.getStock(this.selectedStockId);
        if (!stock) return;

        const hist = this.callbacks.getPriceHistory ? (this.callbacks.getPriceHistory(this.selectedStockId) || [stock.price]) : [stock.price];
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.clientWidth || 1400;
        this.chartWidth = width;
        const height = 320;
        const density = Math.max(2, window.devicePixelRatio || 1);
        this.canvas.width = Math.round(width * density);
        this.canvas.height = Math.round(height * density);
        ctx.setTransform(density, 0, 0, density, 0, 0);
        const scale = parseFloat(document.documentElement.style.zoom) || 1;
        const axisFontSize = Math.max(16, Math.ceil(12 / scale));

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 32, right: Math.max(110, axisFontSize * 6), bottom: 55, left: 50 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;
        this.plotBounds = { left: padding.left, right: width - padding.right, top: padding.top, bottom: height - padding.bottom };

        if (!this.fallbackHistory.has(stock.id) && !this.callbacks.getChartHistory) this.fallbackHistory.set(stock.id, createChartHistory(stock));
        const history = this.callbacks.getChartHistory?.(stock.id) || this.fallbackHistory.get(stock.id);
        const selected = chartPeriod(history, this.selectedTimeframe);
        if (!selected.samples.length) {
            this.points = [];
            this.clearChartPointer();
            return;
        }
        this.visibleHistory = selected.samples;
        this.hideCrosshair();
        const expandedPrices = selected.samples.map(p => p.price);
        const periodDiff = expandedPrices.at(-1) - expandedPrices[0];
        const periodPct = expandedPrices[0] > 0 ? periodDiff / expandedPrices[0] * 100 : 0;
        if (this.modalChange) {
            this.modalChange.textContent = (periodPct >= 0 ? '+' : '') + periodPct.toFixed(2) + '% (' + (periodDiff >= 0 ? '+' : '') + periodDiff + 'G)';
            this.modalChange.className = 'detail-price-change ' + (periodDiff >= 0 ? 'gainer' : 'loser');
        }
        if (this.modalHigh) this.modalHigh.textContent = selected.high.toLocaleString() + 'G';
        if (this.modalLow) this.modalLow.textContent = selected.low.toLocaleString() + 'G';
        if (this.modalAvg) this.modalAvg.textContent = selected.average.toLocaleString() + 'G';
        if (this.modalDate) this.modalDate.textContent = '모의 시세 · 최근 ' + selected.period.label;
        const hint = this.modal?.querySelector('.scroll-navigation-hint span');
        if (hint) hint.textContent = this.selectedTimeframe === 'LIVE' ? '◀ 최근 50개 가격 기록 · 기록별 동일 간격 ▶' : '◀ 좌우로 이동해 최근 ' + selected.period.label + '의 주가 흐름을 확인하세요 ▶';

        const { minPrice, maxPrice } = chartPriceRange(expandedPrices);
        const range = maxPrice - minPrice || 1;

        const firstTime = selected.samples[0].time;
        const lastTime = selected.samples.at(-1).time;
        const timeSpan = Math.max(1, lastTime - firstTime);
        const xForTime = time => padding.left + (time - firstTime) / timeSpan * chartW;
        // Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartH / 5) * i;
            const price = Math.round(maxPrice - (range / 5) * i);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = '#e6edf5';
            ctx.font = `700 ${axisFontSize}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(`${price.toLocaleString()}G`, width - 15, y + 4);
        }

        for (let i = 0; i <= 8; i++) {
            const index = Math.round((selected.samples.length - 1) * i / 8);
            const time = this.selectedTimeframe === 'LIVE' ? selected.samples[index].time : firstTime + timeSpan * i / 8;
            const x = this.selectedTimeframe === 'LIVE' ? padding.left + index / Math.max(1, selected.samples.length - 1) * chartW : xForTime(time);
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = '#e6edf5';
            ctx.font = `700 ${axisFontSize}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(chartTimeLabel(time, this.selectedTimeframe), x, height - 15);
        }
        ctx.setLineDash([]);

        // Points
        this.points = expandedPrices.map((price, idx) => {
            const x = this.selectedTimeframe === 'LIVE' ? padding.left + idx / Math.max(1, selected.samples.length - 1) * chartW : xForTime(selected.samples[idx].time);
            const y = padding.top + chartH - ((price - minPrice) / range) * chartH;
            const firstPrice = expandedPrices[0];
            const diffPct = firstPrice > 0 ? ((price - firstPrice) / firstPrice) * 100 : 0;
            return { x, y, price, diffPct, time: chartTimeLabel(selected.samples[idx].time, this.selectedTimeframe, true) };
        });

        const isPositive = periodDiff >= 0;
        const lineColor = isPositive ? '#00e5ff' : '#ff3b5c';
        const gradTop = isPositive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 59, 92, 0.35)';

        // Fill
        const fillGrad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        fillGrad.addColorStop(0, gradTop);
        fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, height - padding.bottom);
        this.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(this.points[this.points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        this.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (this.lastChartPointer) this.queueChartHover(this.lastChartPointer);
    }
}
