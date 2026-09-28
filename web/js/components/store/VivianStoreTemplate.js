/**
 * VivianStoreTemplate
 * Generates semantic HTML markup for Vivian's General Store modal & interior scene.
 */

import { VIVIAN_TABS } from '../../data/vivianStoreData.js';

export function getVivianStoreHtml() {
    const tabsHtml = Object.values(VIVIAN_TABS).map(tab => `
        <button class="vivian-tab-btn" data-tab="${tab.id}">
            <span class="vivian-tab-icon">${tab.icon}</span>
            <span class="vivian-tab-name">${tab.name}</span>
        </button>
    `).join('');

    return `
        <div id="vivianStoreModal" class="modal-overlay hidden vivian-store-overlay">
            <section class="vivian-interior" id="vivianInterior" tabindex="-1" aria-label="비비안 잡화점 내부">
                <img class="vivian-interior-art" src="${new URL('../../../assets/interiors/VivianStoreInterior-isometric-v2.png', import.meta.url).href}" alt="왼쪽 자동 유리문과 쇼윈도, 뒤쪽 냉장고, 오른쪽 계산대와 넓은 바닥이 있는 아이소메트릭 잡화점 내부" draggable="false">
                <div class="town-player-character vivian-player" id="vivianPlayer" aria-label="플레이어 캐릭터">
                    <div class="town-char-body"><div class="char-face-front"><span class="char-eye left"></span><span class="char-eye right"></span><span class="char-smile"></span><span class="char-badge-pip"></span></div></div>
                    <div class="town-char-shadow"></div>
                </div>
                <button class="vivian-walkway" id="vivianWalkway" aria-label="바닥을 클릭해 이동"></button>
                <button class="vivian-interior-hotspot vivian-door-hotspot" id="btnVivianDoor" aria-label="출입문으로 나가기"></button>
                <span class="vivian-door-prompt" id="vivianDoorPrompt" hidden>F · 나가기</span>
                <button class="vivian-interior-hotspot vivian-counter-hotspot" data-store-browse="daily" aria-label="계산대 이용하기"></button>
            </section>
            <div class="modal-card vivian-store-card hidden" id="vivianShopPanel" role="dialog" aria-label="비비안 잡화점 상품 구매">
                <!-- Top Neon Ambient Header -->
                <div class="vivian-store-header">
                    <div class="vivian-header-brand">
                        <div class="vivian-header-icon-box">🏪</div>
                        <div class="vivian-header-titles">
                            <div class="vivian-header-title-row">
                                <span class="vivian-store-title">비비안 잡화점</span>
                                <span class="vivian-badge-online">OPEN 24H</span>
                            </div>
                            <div class="vivian-header-desc">증시 생존을 위한 필수 소모품 및 특수 전술 장비 보급소</div>
                        </div>
                    </div>

                    <div class="vivian-header-meta">
                        <div class="vivian-meta-chip">
                            <span class="meta-label">보유 골드</span>
                            <span class="meta-val gold" id="vivianUserCash">0 G</span>
                        </div>
                        <div class="vivian-meta-chip">
                            <span class="meta-label">비비안 신뢰도</span>
                            <span class="meta-val affinity" id="vivianAffinityBadge">Lv.1 💖 (0/100)</span>
                        </div>
                        <button class="vivian-close-btn" id="btnVivianClose" title="상점 내부로 돌아가기 (ESC)" aria-label="구매창 닫기">✕</button>
                    </div>
                </div>

                <!-- Main Split Stage Body -->
                <div class="vivian-store-body">
                    <!-- Left: NPC Vivian Saloon Counter -->
                    <div class="vivian-npc-panel">
                        <!-- Portrait Frame (Ready for 2D/3D illustration asset) -->
                        <div class="vivian-portrait-card">
                            <div class="vivian-portrait-viewport" id="vivianPortraitViewport">
                                <img id="vivianPortrait" class="vivian-portrait-image"
                                     src="assets/characters/vivian/vivian-dialogue-neutral-v1.png"
                                     alt="비비안 — 차분한 미소" draggable="false">
                                <div class="vivian-portrait-mood-tag" id="vivianMoodTag">영업 중 • 침착</div>
                            </div>
                            <div class="vivian-nameplate">
                                <div class="vivian-npc-name">비비안 (Vivian)</div>
                                <div class="vivian-npc-role">실용주의 보급상 & 정보 브로커</div>
                            </div>
                        </div>

                        <!-- Dialogue Speech Bubble -->
                        <div class="vivian-dialogue-bubble">
                            <div class="vivian-speech-header">
                                <span class="vivian-dot-pulse"></span>
                                <span class="speech-title">비비안의 메시지</span>
                            </div>
                            <div class="vivian-speech-content" id="vivianSpeechText">
                                "증시라는 전쟁터로 다시 들어가시려고요? 제대로 된 보급 없이는 1분도 못 버티고 깡통 차게 될 텐데요."
                            </div>
                        </div>

                        <!-- NPC Interactive Quick Buttons -->
                        <div class="vivian-npc-actions">
                            <button class="vivian-action-chip" id="btnVivianTalk">💬 잡담하기</button>
                            <button class="vivian-action-chip" id="btnVivianTip">💡 상점 팁</button>
                            <button class="vivian-action-chip" id="btnVivianSecretHint">🗝️ 비밀 매대 정보</button>
                        </div>

                        <!-- Brand-Linked Consumption Banner (GDD MOD_GDD_03_0) -->
                        <div class="vivian-stock-link-box">
                            <div class="stock-link-header">
                                <span class="icon">📈</span>
                                <span>상점 소비 주가 연동 안내</span>
                            </div>
                            <div class="stock-link-desc">
                                잡화점 아이템 구매액은 납품사인 <b>[모닝 브루]</b> 및 <b>[포레스트 랩]</b>의 분기 매출로 직결되어 주가 상승 모멘텀을 형성합니다.
                            </div>
                        </div>
                    </div>

                    <!-- Right: Store Showcase & Item Selection -->
                    <div class="vivian-shelves-panel">
                        <!-- Navigation Tabs Bar -->
                        <div class="vivian-tabs-bar" id="vivianTabsContainer">
                            ${tabsHtml}
                        </div>

                        <!-- Shelf Banner Info -->
                        <div class="vivian-shelf-banner" id="vivianShelfBanner">
                            <span class="shelf-banner-icon" id="shelfBannerIcon">⚡</span>
                            <span class="shelf-banner-desc" id="shelfBannerDesc">매일 00:00 갱신되는 일일 필수 소모품입니다.</span>
                        </div>

                        <!-- Items Grid Container -->
                        <div class="vivian-items-scrollable">
                            <div class="vivian-items-grid" id="vivianItemsGrid">
                                <!-- Dynamic Rendered Item Cards -->
                            </div>
                        </div>

                        <!-- Bottom Selected Item Drawer / Purchase Controls -->
                        <div class="vivian-purchase-drawer" id="vivianPurchaseDrawer">
                            <div class="drawer-left">
                                <div class="drawer-icon-box" id="drawerItemIcon">🥤</div>
                                <div class="drawer-info-group">
                                    <div class="drawer-title-row">
                                        <span class="drawer-item-name" id="drawerItemName">몬스터 에너지 드링크</span>
                                        <span class="drawer-rarity-badge" id="drawerRarityBadge">일반</span>
                                    </div>
                                    <div class="drawer-item-desc" id="drawerItemDesc">
                                        스테미너 하트 1칸 즉시 회복. 일일 2개 구매 제한.
                                    </div>
                                    <div class="drawer-effects-row" id="drawerEffectsRow">
                                        <span class="effect-tag">❤️ 체력 1 회복</span>
                                    </div>
                                </div>
                            </div>

                            <div class="drawer-right">
                                <div class="drawer-qty-group">
                                    <span class="qty-label">수량</span>
                                    <div class="qty-stepper">
                                        <button class="qty-btn" id="btnQtyMinus">-</button>
                                        <input type="number" class="qty-input" id="vivianQtyInput" value="1" min="1" max="99">
                                        <button class="qty-btn" id="btnQtyPlus">+</button>
                                    </div>
                                    <button class="qty-max-btn" id="btnQtyMax">최대</button>
                                </div>

                                <div class="drawer-price-group">
                                    <div class="price-subtext">총 결제 금액</div>
                                    <div class="price-total" id="vivianTotalPrice">500 G</div>
                                </div>

                                <div class="drawer-actions-group">
                                    <button class="btn-vivian-buy" id="btnVivianBuy">💳 구매하기</button>
                                    <button class="btn-vivian-consume" id="btnVivianConsume" title="구매 즉시 효과 적용">⚡ 구매 후 즉시 사용</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Quick Navigation -->
                <div class="vivian-store-footer">
                    <div class="footer-tips">
                        <span class="key-badge">1~3</span> 탭 전환 &nbsp;|&nbsp;
                        <span class="key-badge">E</span> 구매 &nbsp;|&nbsp;
                        <span class="key-badge">ESC</span> 상점 내부로 돌아가기
                    </div>
                    <div class="footer-actions">
                        <button class="footer-inv-btn" id="btnVivianOpenBag">🎒 소지품 가방 열기</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
