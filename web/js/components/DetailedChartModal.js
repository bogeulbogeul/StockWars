/**
 * DetailedChartModal Component
 * Unity equivalent: UIDetailedChartModal.cs
 * Full-screen expanded horizontal scrollable canvas stock chart with crosshair tooltips.
 */

import { SECTORS } from '../data/stocksData.js';

export class DetailedChartModal {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.selectedStockId = 'CLOUDBERRY';
        this.selectedTimeframe = '1D';
        this.points = [];

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
                            <button class="tf-btn pill-btn active" data-tf="1D">1D</button>
                            <button class="tf-btn pill-btn" data-tf="1W">1W</button>
                            <button class="tf-btn pill-btn" data-tf="1M">1M</button>
                            <button class="tf-btn pill-btn" data-tf="1Y">1Y</button>
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
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
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

        // Horizontal Drag Scroll
        const wrapper = this.scrollWrapper;
        if (wrapper) {
            let isDragging = false;
            let startX = 0;
            let scrollLeft = 0;

            const onStart = (clientX) => {
                isDragging = true;
                wrapper.classList.add('active-drag');
                startX = clientX - wrapper.offsetLeft;
                scrollLeft = wrapper.scrollLeft;
            };

            const onMove = (clientX) => {
                if (!isDragging) return;
                const x = clientX - wrapper.offsetLeft;
                wrapper.scrollLeft = scrollLeft - (x - startX) * 1.5;
            };

            const onEnd = () => {
                isDragging = false;
                wrapper.classList.remove('active-drag');
            };

            wrapper.addEventListener('mousedown', (e) => onStart(e.clientX));
            window.addEventListener('mousemove', (e) => onMove(e.clientX));
            window.addEventListener('mouseup', () => onEnd());

            wrapper.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true });
            wrapper.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
            wrapper.addEventListener('touchend', () => onEnd());
        }

        // Crosshair Hover
        if (this.canvas) {
            const handleHover = (e) => {
                if (!this.points || this.points.length === 0) return;
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;

                let closest = this.points[0];
                let minDist = Math.abs(mouseX - closest.x);

                this.points.forEach(p => {
                    const dist = Math.abs(mouseX - p.x);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = p;
                    }
                });

                if (closest && this.tooltip) {
                    this.tooltip.classList.remove('hidden');
                    this.tooltip.style.left = `${closest.x}px`;
                    this.tooltip.style.top = `${closest.y - 45}px`;

                    if (this.ttTime) this.ttTime.textContent = closest.time || '시간';
                    if (this.ttPrice) this.ttPrice.textContent = `${closest.price.toLocaleString()} G`;
                    if (this.ttChange) {
                        const isPos = closest.diffPct >= 0;
                        this.ttChange.textContent = `${isPos ? '+' : ''}${closest.diffPct.toFixed(2)}%`;
                        this.ttChange.className = `tt-change ${isPos ? 'gainer' : 'loser'}`;
                    }
                }
            };

            this.canvas.addEventListener('mousemove', handleHover);
            this.canvas.addEventListener('mouseleave', () => {
                this.tooltip?.classList.add('hidden');
            });
        }
    }

    open(stockId) {
        this.selectedStockId = stockId || 'CLOUDBERRY';
        this.modal?.classList.remove('hidden');
        this.updateContent();

        // Scroll to rightmost (most recent)
        setTimeout(() => {
            if (this.scrollWrapper) {
                this.scrollWrapper.scrollLeft = this.scrollWrapper.scrollWidth;
            }
        }, 50);
    }

    close() {
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
        const width = 2800;
        const height = 320;
        this.canvas.width = width;
        this.canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 40, right: 80, bottom: 45, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Expanded dataset for rich wide scrolling
        let expandedPrices = [];
        let timeLabels = [];

        const totalBars = 80;
        const base = stock.price;

        for (let i = 0; i < totalBars; i++) {
            const histIdx = Math.floor((i / totalBars) * hist.length);
            const val = hist[histIdx] || base;
            const noise = (Math.sin(i * 0.4) + Math.cos(i * 0.7)) * (base * 0.015);
            const p = Math.max(10, Math.round(val + noise));
            expandedPrices.push(p);

            const minOffset = (totalBars - i) * 3;
            const t = new Date(Date.now() - minOffset * 60 * 1000);
            timeLabels.push(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
        }

        const minPrice = Math.min(...expandedPrices) * 0.96;
        const maxPrice = Math.max(...expandedPrices) * 1.04;
        const range = maxPrice - minPrice || 1;

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

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '600 12px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${price.toLocaleString()}G`, width - 15, y + 4);
        }

        for (let i = 0; i < totalBars; i += 6) {
            const x = padding.left + (i / (totalBars - 1)) * chartW;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '600 11px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(timeLabels[i] || '', x, height - 15);
        }
        ctx.setLineDash([]);

        // Points
        this.points = expandedPrices.map((price, idx) => {
            const x = padding.left + (idx / (totalBars - 1)) * chartW;
            const y = padding.top + chartH - ((price - minPrice) / range) * chartH;
            const firstPrice = expandedPrices[0];
            const diffPct = firstPrice > 0 ? ((price - firstPrice) / firstPrice) * 100 : 0;
            return { x, y, price, diffPct, time: timeLabels[idx] };
        });

        const isPositive = stock.price >= stock.prevPrice;
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
    }
}
