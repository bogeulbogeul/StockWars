/**
 * PortfolioTab Component (스마트폰 HTS 내 계좌 & 포트폴리오 탭)
 * Handles user profile, holding stock cards, and sector allocation donut chart rendering.
 */

import { SECTORS } from '../../data/stocksData.js?v=v72';

export class PortfolioTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;
    }

    updateState(state) {
        if (!state) return;
        this.renderTradeHistory(state.tradeHistory || []);
        this.renderPortfolio(state.portfolio);
        this.renderSectorAllocation(state.portfolio);
    }

    renderTradeHistory(history) {
        if (!this.dom.tradeHistoryList) return;
        if (this.lastHistory === history && this.lastHistoryCount === history.length) return;
        this.lastHistory = history;
        this.lastHistoryCount = history.length;
        if (this.dom.tradeHistoryCount) this.dom.tradeHistoryCount.textContent = `${history.length}건`;
        const list = this.dom.tradeHistoryList;
        list.replaceChildren();
        if (!history.length) {
            const empty = document.createElement('p');
            empty.className = 'trade-history-note';
            empty.textContent = '아직 체결된 거래가 없습니다.';
            list.append(empty);
            return;
        }
        const labels = { buy: '매수', sell: '매도', short: '공매도', liquidate: '일괄 청산' };
        for (const trade of [...history].reverse()) {
            const row = document.createElement('article');
            row.className = 'trade-history-row';
            const heading = document.createElement('strong');
            heading.textContent = `${labels[trade.side] || trade.side} · ${trade.stockName} (${trade.stockId})`;
            const time = document.createElement('small');
            time.textContent = `${trade.day}일차 · ${new Date(trade.time).toLocaleString('ko-KR')}`;
            const price = document.createElement('div');
            price.textContent = `${trade.quantity.toLocaleString()}주 · 평균 ${trade.price.toLocaleString(undefined,{maximumFractionDigits:2})}G` + (trade.leverage ? ` · ${trade.leverage}x` : '');
            const amount = document.createElement('div');
            amount.textContent = `현금 ${trade.cashDelta >= 0 ? '+' : ''}${trade.cashDelta.toLocaleString()}G`;
            const fee = document.createElement('div');
            fee.textContent = `수수료 ${(trade.fee ?? 0).toLocaleString()}G` + (trade.feeRate != null ? ` · ${trade.venue === 'brokerage' ? '증권사' : '스마트폰'} ${(trade.feeRate * 100).toFixed(2)}%` : '');
            row.append(heading, time, price, fee, amount);
            if (trade.profit != null) {
                const profit = document.createElement('div');
                profit.className = trade.profit >= 0 ? 'gainer' : 'loser';
                profit.textContent = `실현 손익 ${trade.profit >= 0 ? '+' : ''}${trade.profit.toLocaleString()}G`;
                row.append(profit);
            }
            if (trade.fills?.length) {
                const fills = document.createElement('details');
                const title = document.createElement('summary');
                title.textContent = `가격별 체결 ${trade.fills.length}건` + (trade.requested > trade.quantity ? ` · 주문 ${trade.requested}주 중 ${trade.quantity}주 체결` : '');
                fills.append(title);
                for (const fill of trade.fills) {
                    const line = document.createElement('div');
                    line.textContent = `${fill.quantity.toLocaleString()}주 × ${fill.price.toLocaleString()}G`;
                    fills.append(line);
                }
                row.append(fills);
            }
            list.append(row);
        }
    }

    updateUserProfile(profile) {
        if (!profile) return;
        if (this.dom.profileName && profile.nickname) this.dom.profileName.textContent = profile.nickname;
        if (this.dom.profileAvatar && profile.avatar) this.dom.profileAvatar.textContent = profile.avatar;
        if (this.dom.profileTitle && profile.tptType) this.dom.profileTitle.textContent = `${profile.tptType} 트레이더 • 레벨 1`;
    }

    renderPortfolio(portfolio = []) {
        if (!this.dom.portfolioListContainer) return;
        if (portfolio.length === 0) {
            this.dom.portfolioListContainer.innerHTML = `<div class="item-desc" style="text-align:center; padding:20px;">보유 중인 주식이 없습니다.</div>`;
            return;
        }

        this.dom.portfolioListContainer.innerHTML = portfolio.map(item => {
            const isPos = item.profitLoss >= 0;
            const modeBadge = item.isShort ? `<span class="lock-tag" style="background:#ff3b5c; color:#fff;">SHORT ${item.leverage}x</span>` : (item.leverage > 1 ? `<span class="lock-tag" style="background:#00e5ff; color:#000;">LONG ${item.leverage}x</span>` : '');

            return `
                <div class="portfolio-item" data-id="${item.id}">
                    <div>
                        <div class="port-stock-name">${item.stock.name} (${item.id}) ${modeBadge}</div>
                        <div class="port-stock-sub">보유: ${item.qty}주 • 평균가: ${item.avgPrice.toLocaleString()}G</div>
                    </div>
                    <div class="port-right">
                        <div class="port-val">${Math.round(item.currentVal).toLocaleString()}G</div>
                        <div class="port-pl ${isPos ? 'gainer' : 'loser'}">
                            ${isPos ? '+' : ''}${Math.round(item.profitLoss).toLocaleString()}G (${isPos ? '+' : ''}${item.profitLossPct.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.dom.portfolioListContainer.querySelectorAll('.portfolio-item').forEach(el => {
            el.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(el.dataset.id);
                }
            });
        });
    }

    renderSectorAllocation(portfolio = []) {
        if (!this.dom.sectorDonutChart) return;
        const canvas = this.dom.sectorDonutChart;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const sectorWeights = new Map();
        let totalVal = 0;

        portfolio.forEach(item => {
            const sec = item.stock.sector || '기타';
            const val = item.currentVal;
            totalVal += val;
            sectorWeights.set(sec, (sectorWeights.get(sec) || 0) + val);
        });

        if (this.dom.donutCenterVal) {
            this.dom.donutCenterVal.textContent = `${sectorWeights.size}개`;
        }

        if (totalVal <= 0 || sectorWeights.size === 0) {
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 44, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 14;
            ctx.stroke();

            if (this.dom.allocationLegendList) {
                this.dom.allocationLegendList.innerHTML = `<div class="item-desc">보유 종목이 없습니다.</div>`;
            }
            return;
        }

        let startAngle = -Math.PI / 2;
        let legendHtml = '';

        sectorWeights.forEach((val, secKey) => {
            const sec = SECTORS[secKey] || { name: secKey, color: '#00e5ff' };
            const sliceAngle = (val / totalVal) * Math.PI * 2;
            const pct = ((val / totalVal) * 100).toFixed(1);

            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 44, startAngle, startAngle + sliceAngle);
            ctx.strokeStyle = sec.color;
            ctx.lineWidth = 14;
            ctx.stroke();

            startAngle += sliceAngle;

            legendHtml += `
                <div class="legend-row">
                    <span class="legend-dot" style="background: ${sec.color};"></span>
                    <span class="legend-name">${sec.name}</span>
                    <span class="legend-pct">${pct}%</span>
                </div>
            `;
        });

        if (this.dom.allocationLegendList) {
            this.dom.allocationLegendList.innerHTML = legendHtml;
        }
    }
}
