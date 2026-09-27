/**
 * TownBuildingRenderer Component
 * Renders town buildings, mock windows, interactive props (benches, billboard), street lamps, and modal popups.
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_STREET_LAMPS, TOWN_URBAN_TREES, TOWN_DIRECTION_SIGNS } from '../../data/townWorldData.js';

export class TownBuildingRenderer {
    static renderBuildingsHTML() {
        return TOWN_BUILDINGS.map(b => `
            <div class="town-building-box building-with-asset ${b.isMainLandmark ? 'landmark-main' : ''}"
                 id="building_${b.id}"
                 data-building-id="${b.id}"
                 data-building-name="${b.name}"
                 data-building-desc="${b.desc}"
                 data-action-text="${b.actionText}"
                 aria-label="${b.name}${b.available === false ? ' · 개점 준비 중' : ''}"
                 ${b.available === false ? 'aria-disabled="true"' : ''}
                 style="left: ${b.x}px; width: ${b.width}px; height: ${b.height}px;">
                <svg class="building-artwork" width="${b.asset.displayWidth}" height="${b.height}"
                     viewBox="${b.asset.x} ${b.asset.y} ${b.asset.cropWidth} ${b.asset.cropHeight}"
                     aria-hidden="true" focusable="false">
                    <image href="${b.asset.src}" width="${b.asset.width}" height="${b.asset.height}" />
                </svg>
            </div>
        `).join('');
    }
    static renderInteractivePropsHTML() {
        return TOWN_INTERACTIVE_PROPS.map(p => {
            if (p.type === 'bench') {
                return `
                    <div class="town-bench-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px;">
                        <svg class="town-prop-art" viewBox="154 136 1468 620" aria-hidden="true" focusable="false">
                            <image href="${new URL('../../../assets/props/Banch.png', import.meta.url).href}" width="1774" height="887" />
                        </svg>
                    </div>
                `;
            } else if (p.type === 'billboard') {
                return `
                    <div class="town-billboard-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px; height: ${p.height}px;">
                        <svg class="billboard-frame-art" viewBox="96 54 1344 916" aria-hidden="true" focusable="false">
                            <image href="${new URL('../../../assets/props/BillboardFrame.png', import.meta.url).href}" width="1536" height="1024" />
                        </svg>
                        <!-- LED Display Enclosure -->
                        <div class="billboard-screen-frame">
                            <div class="billboard-top-status">
                                <span class="live-dot-pulse"></span>
                                <span class="live-title">LIVE NEWS & AD</span>
                                <span class="live-tag">CIPHER CENTRAL</span>
                            </div>
                            <!-- Screen Content Area -->
                            <div class="billboard-main-screen">
                                <div class="billboard-slides-container" id="townBillboardSlides">
                                        <div class="billboard-news-slide active">
                                            <div class="news-badge-row">
                                                <span class="news-badge badge-ad">사이퍼 센트럴</span>
                                            </div>
                                            <p class="news-body-text"></p>
                                        </div>
                                </div>
                                <!-- Live Cipher Index: duplicate for continuous scrolling. -->
                                <div class="billboard-ticker-tape">
                                    <div class="ticker-text-track">
                                        <span class="cipher-index-value">사이퍼 지수</span>
                                        <span class="cipher-index-value" aria-hidden="true">사이퍼 지수</span>
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
                    <svg class="lamp-art" viewBox="360 20 310 1495" aria-hidden="true" focusable="false">
                        <image href="${new URL('../../../assets/props/StreetLamp-off.png', import.meta.url).href}" width="1024" height="1536" />
                    </svg>
                    <div class="lamp-bulb"></div>
                    <div class="lamp-halo"></div>
                    <div class="lamp-light"></div>
                </div>
            `;
        });
        TOWN_URBAN_TREES.forEach(x => {
            html += `
                <div class="town-urban-tree" style="left: ${x}px;">
                    <svg class="town-prop-art" viewBox="30 25 1140 1260" aria-hidden="true" focusable="false">
                        <image href="${new URL('../../../assets/props/Tree.png', import.meta.url).href}" width="1189" height="1323" />
                    </svg>
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
