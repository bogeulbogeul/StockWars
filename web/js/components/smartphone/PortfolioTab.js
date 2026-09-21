/**
 * PortfolioTab Component (스마트폰 내 계좌/자산 탭)
 * Handles player identity, holding stocks portfolio list, and sector allocation donut chart.
 */

import { SECTORS } from '../../data/stocksData.js';
import { createGeometricAvatarSVG } from '../GeometricAvatar.js';

export class PortfolioTab {
    constructor(domElements, callbacks = {}) {
        this.dom = domElements;
        this.callbacks = callbacks;

        this.initEventListeners();
    }

    initEventListeners() {
        this.dom.btnProfileSettlement?.addEventListener('click', () => {
            if (this.callbacks.onTriggerSettlement) this.callbacks.onTriggerSettlement();
        });
        this.dom.btnProfileReset?.addEventListener('click', () => {
            if (this.callbacks.onReset) this.callbacks.onReset();
        });
    }

    updateUserProfile(profile) {
        if (!profile) return;
        if (this.dom.profileAvatar) {
            this.dom.profileAvatar.innerHTML = createGeometricAvatarSVG(profile, 48);
            this.dom.profileAvatar.style.width = '48px';
            this.dom.profileAvatar.style.height = '48px';
        }
        if (this.dom.profileName) {
            this.dom.profileName.textContent = profile.nickname || '사이퍼 트레이더';
        }
        if (this.dom.profileTitle && profile.trait) {
            this.dom.profileTitle.textContent = ${profile.trait.title} • 레벨 1 ();
        }
    }

    updateState(state) {
        if (!state) return;
        this.renderPortfolio(state.portfolio);
        this.renderSectorAllocation(state.portfolio);
    }

    renderPortfolio(portfolio) {
        if (!this.dom.portfolioListContainer || !portfolio) return;
        if (portfolio.length === 0) {
            this.dom.portfolioListContainer.innerHTML = <div class="item-desc" style="text-align:center; padding:20px;">보유 중인 주식이 없습니다.</div>;
            return;
        }

        this.dom.portfolioListContainer.innerHTML = portfolio.map(item => {
            const isPos = item.profitLoss >= 0;
            const modeBadge = item.isShort ? <span class="lock-tag" style="background:#ff3b5c; color:#fff;">SHORT x</span> : (item.leverage > 1 ? <span class="lock-tag" style="background:#00e5ff; color:#000;">LONG x</span> : '');

            return 
                <div class="portfolio-item" data-id="">
                    <div>
                        <div class="port-stock-name"> () </div>
                        <div class="port-stock-sub">보유: 주 • 평균가: G</div>
                    </div>
                    <div class="port-right">
                        <div class="port-val">G</div>
                        <div class="port-pl ">
                            G (%)
                        </div>
                    </div>
                </div>
            ;
        }).join('');

        this.dom.portfolioListContainer.querySelectorAll('.portfolio-item').forEach(el => {
            el.addEventListener('click', () => {
                if (this.callbacks.onOpenTradeModal) {
                    this.callbacks.onOpenTradeModal(el.dataset.id);
                }
            });
        });
    }

    renderSectorAllocation(portfolio) {
        if (!this.dom.sectorDonutChart || !portfolio) return;
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
            this.dom.donutCenterVal.textContent = ${sectorWeights.size}개;
        }

        if (totalVal <= 0 || sectorWeights.size === 0) {
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, 44, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 14;
            ctx.stroke();

            if (this.dom.allocationLegendList) {
                this.dom.allocationLegendList.innerHTML = <div class="item-desc">보유 종목이 없습니다.</div>;
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

            legendHtml += 
                <div class="legend-row">
                    <span class="legend-dot" style="background: ;"></span>
                    <span class="legend-name"></span>
                    <span class="legend-pct">%</span>
                </div>
            ;
        });

        if (this.dom.allocationLegendList) {
            this.dom.allocationLegendList.innerHTML = legendHtml;
        }
    }
}