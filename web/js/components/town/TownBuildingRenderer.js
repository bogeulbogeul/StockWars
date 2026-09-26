/**
 * TownBuildingRenderer Component
 * Renders town buildings, mock windows, interactive props (benches, billboard), street lamps, and modal popups.
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_STREET_LAMPS, TOWN_URBAN_TREES, TOWN_DIRECTION_SIGNS, TOWN_BILLBOARD_NEWS } from '../../data/townWorldData.js';

export class TownBuildingRenderer {
    static renderBuildingsHTML() {
        return TOWN_BUILDINGS.map(b => `
            <div class="town-building-box theme-${b.colorTheme} ${b.isMainLandmark ? 'landmark-main' : ''} ${b.isOfficetel ? 'building-officetel' : ''}" 
                 id="building_${b.id}"
                 data-building-id="${b.id}"
                 data-building-name="${b.name}"
                 data-building-desc="${b.desc}"
                 data-action-text="${b.actionText}"
                 style="left: ${b.x}px; width: ${b.width}px; height: ${b.height}px;">
                
                <!-- Architectural Rooftop Parapet / Header Plate -->
                <div class="building-roof-parapet">
                    <div class="parapet-header-bar">
                        <span class="building-category-tag">${b.category}</span>
                        <span class="building-name-plate">${b.name}</span>
                    </div>
                    ${b.isOfficetel ? '<div class="officetel-penthouse-top"><span class="penthouse-window"></span><span class="penthouse-window"></span></div>' : ''}
                </div>

                <!-- Modular Architectural Asset Slot -->
                <div class="building-asset-slot" data-slot-id="${b.id}">
                    <div class="building-wireframe-facade">
                        <div class="building-windows-grid">
                            ${this.renderMockWindows(b.width, b.height, b.isOfficetel)}
                        </div>
                        <div class="building-entrance-gate">
                            <span class="entrance-door-light"></span>
                            <span class="entrance-text">${b.name} 출입구</span>
                        </div>
                    </div>
                </div>

                <!-- Ground Shadow Base -->
                <div class="building-base-shadow"></div>
            </div>
        `).join('');
    }

    static renderInteractivePropsHTML() {
        return TOWN_INTERACTIVE_PROPS.map(p => {
            if (p.type === 'bench') {
                return `
                    <div class="town-bench-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px;">
                        <div class="bench-aura-glow"></div>
                        <div class="bench-structure">
                            <div class="bench-backrest">
                                <span class="bench-slat"></span>
                                <span class="bench-slat"></span>
                            </div>
                            <div class="bench-seat">
                                <span class="bench-slat"></span>
                                <span class="bench-slat"></span>
                            </div>
                            <div class="bench-armrests">
                                <span class="arm-left"></span>
                                <span class="arm-right"></span>
                            </div>
                            <div class="bench-legs">
                                <span class="leg-left"></span>
                                <span class="leg-right"></span>
                            </div>
                        </div>
                        <div class="bench-name-tag">힐링 벤치</div>
                        <div class="bench-shadow"></div>
                    </div>
                `;
            } else if (p.type === 'billboard') {
                return `
                    <div class="town-billboard-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px; height: ${p.height}px;">
                        <!-- Steel Pylons Support Truss -->
                        <div class="billboard-pylons">
                            <div class="pylon-leg left"></div>
                            <div class="pylon-leg right"></div>
                            <div class="pylon-cross-bracing"></div>
                        </div>
                        <!-- LED Display Enclosure -->
                        <div class="billboard-screen-frame">
                            <div class="billboard-top-status">
                                <span class="live-dot-pulse"></span>
                                <span class="live-title">LIVE NEWS & AD</span>
                                <span class="live-tag">CIPHER CENTRAL</span>
                            </div>
                            <!-- Screen Content Area -->
                            <div class="billboard-main-screen">
                                <div class="screen-scanlines"></div>
                                <div class="billboard-slides-container" id="townBillboardSlides">
                                    ${TOWN_BILLBOARD_NEWS.map((news, idx) => `
                                        <div class="billboard-news-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                                            <div class="news-badge-row">
                                                <span class="news-badge badge-${news.type}">${news.badge}</span>
                                            </div>
                                            <p class="news-body-text">${news.text}</p>
                                        </div>
                                    `).join('')}
                                </div>
                                <!-- Bottom Live Stock Ticker -->
                                <div class="billboard-ticker-tape">
                                    <div class="ticker-text-track">
                                        <span>📈 코스닥 912.45 (+2.6%)</span>
                                        <span>🚀 비트코인 $96,400 (+4.2%)</span>
                                        <span>⚡ 이더리움 $3,850 (+2.8%)</span>
                                        <span>🏛️ 사이퍼 증권 객장 수수료 0.01% 우대 적용 중</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="billboard-base-shadow"></div>
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    static renderStreetPropsHTML() {
        let html = '';
        TOWN_STREET_LAMPS.forEach(x => {
            html += `
                <div class="street-lamp" style="left: ${x}px;">
                    <div class="lamp-head"></div>
                    <div class="lamp-light"></div>
                    <div class="lamp-base"></div>
                </div>
            `;
        });
        TOWN_URBAN_TREES.forEach(x => {
            html += `
                <div class="town-urban-tree" style="left: ${x}px;">
                    <div class="tree-foliage">
                        <span class="foliage-layer layer-1"></span>
                        <span class="foliage-layer layer-2"></span>
                    </div>
                    <div class="tree-trunk"></div>
                    <div class="tree-planter-pot"></div>
                </div>
            `;
        });
        TOWN_DIRECTION_SIGNS.forEach(sign => {
            html += `
                <div class="town-direction-sign" style="left: ${sign.x}px;">
                    <div class="sign-plate">${sign.text}</div>
                    <div class="sign-pole"></div>
                </div>
            `;
        });
        return html;
    }

    static renderBillboardModalHTML() {
        return `
            <div class="town-billboard-modal-overlay hidden" id="townBillboardModal">
                <div class="town-billboard-modal-dialog">
                    <div class="billboard-modal-header">
                        <div class="modal-title-group">
                            <span class="modal-title-icon">📺</span>
                            <div>
                                <h3 class="modal-title-text">사이퍼 센트럴 미디어 뉴스 & 광고 브리핑</h3>
                                <p class="modal-subtitle-text">실시간 속보 찌라시 및 상점 특가 이벤트 / 증시 종합 시황</p>
                            </div>
                        </div>
                        <button class="modal-close-btn" id="btnBillboardClose">✕</button>
                    </div>
                    <div class="billboard-modal-body">
                        <div class="briefing-section">
                            <h4 class="section-title">🔥 실시간 긴급 속보 & 찌라시</h4>
                            <div class="news-list-grid">
                                <div class="news-card-item breaking">
                                    <span class="news-card-badge">속보</span>
                                    <div class="news-card-content">
                                        <div class="news-card-headline">바이오닉스, 차세대 AI 신약 임상 3상 돌파 루머</div>
                                        <div class="news-card-detail">FDA 승인 임박 소식과 함께 장외 거래량 500% 급증. 제약/바이오 섹터 강력한 수급 유입 중.</div>
                                    </div>
                                </div>
                                <div class="news-card-item market">
                                    <span class="news-card-badge">시황</span>
                                    <div class="news-card-content">
                                        <div class="news-card-headline">코스닥 반도체 & 친환경 테마주 외인 대규모 순매수</div>
                                        <div class="news-card-detail">기술주 중심의 강한 반등 랠리 지속. 주간 누적 수익률 상위 트레이더 다수 배출.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="briefing-section">
                            <h4 class="section-title">🛍️ 타운 상점 특별 프로모션</h4>
                            <div class="ad-list-grid">
                                <div class="ad-card-item shop">
                                    <span class="ad-card-badge">잡화점</span>
                                    <div class="ad-card-content">
                                        <div class="ad-card-title">비비안 잡화점: 몬스터 에너지 드링크 20% 특별 세일</div>
                                        <div class="ad-card-desc">기력 회복 소모품 전 품목 특별 할인! 데모 기간 한정 특가 제공 중.</div>
                                    </div>
                                </div>
                                <div class="ad-card-item furniture">
                                    <span class="ad-card-badge">가구점</span>
                                    <div class="ad-card-content">
                                        <div class="ad-card-title">모던 프레임: 오피스텔 8x8 전용 와이드 데스크 입고</div>
                                        <div class="ad-card-desc">내 오피스 인테리어를 업그레이드할 최상위 트레이딩 스테이션 쇼룸 전시 중.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderMockWindows(w, h, isOfficetel = false) {
        const colWidth = isOfficetel ? 45 : 55;
        const rowHeight = isOfficetel ? 40 : 50;
        const cols = Math.max(3, Math.floor(w / colWidth));
        const rows = Math.max(3, Math.floor((h - 80) / rowHeight));
        let windowsHtml = '';
        for (let i = 0; i < cols * rows; i++) {
            const isLit = (i % 3 === 0) || (i % 5 === 1);
            windowsHtml += `<div class="mock-window-pane ${isLit ? 'lit' : ''} ${isOfficetel ? 'officetel-window' : ''}"></div>`;
        }
        return windowsHtml;
    }
}