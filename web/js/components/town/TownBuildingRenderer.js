/**
 * TownBuildingRenderer Component
 * Renders town buildings, mock windows, interactive props (benches, billboard), street lamps, and modal popups.
 */

import { TOWN_BUILDINGS, TOWN_INTERACTIVE_PROPS, TOWN_STREET_LAMPS, TOWN_URBAN_TREES } from '../../data/townWorldData.js';
import { TOWN_LANDSCAPE } from '../../data/townLandscape.js';

export class TownBuildingRenderer {
    static renderLandscapeGroundHTML() {
        // A single union mask prevents internal borders and overlapping texture layers.
        // Keep the west-side walks straight and equally inset from the expanded curb.
        const lanes = 'M1280 140V420H1195V1030H1840V2460 M115 1030H3460 M115 1620H3460 M115 2360H3460 M3020 2240V2360';
        // Use the artwork's door position, rather than the building's center.
        const entrances = TOWN_BUILDINGS.map(b => {
            const laneY = b.y < 1100 ? 1030 : b.y < 1800 ? 1620 : 2360;
            return `M${b.entranceX} ${b.y - 2}V${laneY}`;
        }).join(' ');
        return `<svg class="town-landscape-ground" viewBox="0 0 3700 2600" aria-hidden="true" focusable="false">
            <defs>
                <g id="townWalkShape" fill="none" stroke-linejoin="round">
                    <path d="${lanes}" stroke-width="80" />
                    <path d="${entrances}" stroke-width="64" />
                </g>
                <g id="townFloorShape" fill="white" stroke="white">
                    <use href="#townWalkShape" />
                    <rect x="1344" y="1144" width="1012" height="562" rx="96" stroke="none" />
                    <rect x="2570" y="1850" width="900" height="440" rx="65" stroke="none" />
                    <rect x="940" y="480" width="510" height="470" rx="50" stroke="none" />
                </g>
                <filter id="townFloorExpand" filterUnits="userSpaceOnUse" x="10" y="130" width="3560" height="2340">
                    <feMorphology operator="dilate" radius="7" />
                </filter>
                <mask id="townFloorMask" maskUnits="userSpaceOnUse" x="20" y="140" width="3540" height="2320">
                    <use href="#townFloorShape" />
                </mask>
                <mask id="townFloorEdgeMask" maskUnits="userSpaceOnUse" x="20" y="140" width="3540" height="2320">
                    <use href="#townFloorShape" filter="url(#townFloorExpand)" />
                </mask>
                <mask id="townGardenRimMask" maskUnits="userSpaceOnUse" x="140" y="140" width="3420" height="2320">
                    <rect x="140" y="140" width="3420" height="2320" fill="white" />
                    <use href="#townWalkShape" stroke="black" />
                </mask>
                <linearGradient id="townFloorTone" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="2460">
                    <stop class="town-floor-tone-top" />
                    <stop offset="1" class="town-floor-tone-bottom" />
                </linearGradient>
            </defs>
            <rect class="town-floor-edge" width="3700" height="2600" mask="url(#townFloorEdgeMask)" />
            <g mask="url(#townFloorMask)">
                <rect width="3700" height="2600" fill="url(#townFloorTone)" />
                <image class="town-floor-texture" href="${new URL('../../../assets/ground/topdown-v1/SidewalkMaterial.png', import.meta.url).href}"
                       width="3700" height="2600" preserveAspectRatio="none" />
            </g>
            <!-- Garden rims open wherever a pedestrian lane enters. -->
            <g class="town-garden-rim" mask="url(#townGardenRimMask)">
                <rect x="2585" y="1865" width="870" height="410" rx="52" />
                <rect x="953" y="493" width="484" height="444" rx="39" />
            </g>
            <ellipse class="town-fountain-inlay" cx="1840" cy="1380" rx="250" ry="185" />
        </svg>`;
    }
    static renderLandscapeHTML() {
        return TOWN_LANDSCAPE.map(p => `
            <div id="landscape_${p.id}" class="town-landscape${['bench', 'vending'].includes(p.type) ? ' town-landscape-bench' : ''}"
                 ${['bench', 'vending'].includes(p.type) ? `role="button" tabindex="0" data-prop-id="${p.id}" aria-label="${p.type === 'vending' ? '에너지 드링크 자판기' : '벤치에 앉기 · 기력 회복 하루 1회'}"` : 'aria-hidden="true"'}
                 style="left:${p.x}px;top:${p.y - p.height}px;width:${p.width}px;height:${p.height}px;z-index:${p.y}">
                <svg width="100%" height="100%" viewBox="${p.viewBox}" focusable="false">
                    <image href="${p.src}" width="${p.imageWidth}" height="${p.imageHeight}" />
                    ${p.type === 'fountain' ? `
                    <g class="town-water" fill="none" stroke-linecap="round">
                        <path class="town-water-stream" d="M440 451Q410 565 398 752 M820 451Q850 565 866 752 M630 527Q636 672 630 822" />
                        <path class="town-water-spark" d="M440 451Q410 565 398 752 M820 451Q850 565 866 752 M630 527Q636 672 630 822" />
                        <path class="town-water-jet" d="M630 365Q606 275 579 358 M630 365Q651 275 678 358" />
                        ${[[398,752],[866,752],[630,822]].map(([x,y],i)=>`<ellipse class="town-water-ripple" cx="${x}" cy="${y}" rx="42" ry="15" style="transform-origin:${x}px ${y}px;animation-delay:-${i * .6}s" />`).join('')}
                    </g>` : ''}
                </svg>
                ${p.type === 'billboard' ? `
                <div class="billboard-screen-frame town-information-screen">
                    <div class="town-board-heading"><span class="town-board-dot"></span><span class="live-title">TOWN LIVE</span></div>
                    <div class="news-badge">마을 안내</div>
                    <div class="news-body-text">오늘의 소식을 확인하세요</div>
                    <div class="town-board-ticker"><span class="cipher-index-value">시세 연결 대기</span></div>
                </div>` : ''}
            </div>`).join('');
    }
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
                 style="left: ${b.x}px; width: ${b.width}px; height: ${b.height}px; top: ${b.y - b.height}px; z-index: ${b.y};">
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
                    <div class="town-bench-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px; top: ${p.y - p.height}px; z-index: ${p.y};">
                        <svg class="town-prop-art" viewBox="154 136 1468 620" aria-hidden="true" focusable="false">
                            <image href="${new URL('../../../assets/props/Banch.png', import.meta.url).href}" width="1774" height="887" />
                        </svg>
                    </div>
                `;
            } else if (p.type === 'billboard') {
                return `
                    <div class="town-billboard-prop" id="prop_${p.id}" data-prop-id="${p.id}" style="left: ${p.x}px; width: ${p.width}px; height: ${p.height}px; top: ${p.y - p.height}px; z-index: ${p.y};">
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
                <div class="street-lamp" style="left: ${x}px; top: 1010px; z-index: 1250;">
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
                <div class="town-urban-tree" style="left: ${x}px; top: 974.74px; z-index: 1240;">
                    <svg class="town-prop-art" viewBox="30 25 1140 1260" aria-hidden="true" focusable="false">
                        <image href="${new URL('../../../assets/props/Tree.png', import.meta.url).href}" width="1189" height="1323" />
                    </svg>
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
