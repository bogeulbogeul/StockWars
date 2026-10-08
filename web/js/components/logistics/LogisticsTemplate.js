import { bindingLabel } from '../../app/GameKeys.js';
/**
 * LogisticsTemplate
 * Generates the HTML markup and SVG scene templates for the Bit Logistics Mini-Game modal.
 * GDD Reference: MOD_GDD_02_LaborJobs.md
 */

import { createGeometricAvatarSVG } from '../GeometricAvatar.js';
import { LOGISTICS_ASSETS } from './LogisticsAssets.js?v=2';

export function getLogisticsModalHtml() {
    return `
        <div id="logisticsModalOverlay" class="logistics-modal-overlay">
            <div class="logistics-game-window" id="logisticsGameWindow">
                <!-- Top Window Header HUD -->
                <div class="logistics-header">
                    <div class="logistics-title-group">
                        <span class="logistics-badge">비트 물류 [HUB]</span>
                        <div class="logistics-title">
                            <span>📦 60초 상하차 알바 (관리소장 박씨)</span>
                        </div>
                    </div>

                    <div class="logistics-stats-group">
                        <div class="logistics-stat-item">
                            <span class="logistics-stat-label">남은 시간:</span>
                            <span class="logistics-stat-value logistics-timer-value" id="logisticsTimerText">60s</span>
                        </div>
                        <div class="logistics-stat-item">
                            <span class="logistics-stat-label">배송 점수:</span>
                            <span class="logistics-stat-value" id="logisticsLoadedText">0 / 26점 · 3개 이상 배송 0/2회</span>
                        </div>
                        <div class="logistics-stat-item">
                            <span class="logistics-stat-label">예상 등급:</span>
                            <span class="logistics-stat-value" id="logisticsGradeText" style="color: #94a3b8;">C</span>
                        </div>
                        <div class="logistics-stat-item">
                            <span class="logistics-stat-label">파손:</span>
                            <span class="logistics-stat-value" id="logisticsBrokenText" style="color: #ef4444;">0</span>
                        </div>
                    </div>

                    <div class="logistics-controls-group">
                        <button class="logistics-guide-btn" id="btnLogisticsGuide" title="관리소장 박씨 튜토리얼 가이드">💡 박씨 가이드</button>
                        <button class="logistics-close-btn" id="btnLogisticsClose" title="작업 중단 및 나가기">✕</button>
                    </div>
                </div>

                <!-- News Ticker -->
                <div class="logistics-ticker-bar">
                    <span class="logistics-ticker-badge">속보 TICKER</span>
                    <div class="logistics-ticker-viewport">
                        <div class="logistics-ticker-text" id="logisticsTickerText">
                            ⚡ [속보] 글로벌 반도체 공급망 개편 소식에 IT 섹터 강세 지속 • 비트 물류 HUB 야간 화물 물동량 25% 급증 • 비비안 잡화점 에너지 드링크 재입고 완료!
                        </div>
                    </div>
                </div>

                <!-- 2D Gameplay Viewport -->
                <div class="logistics-game-canvas-area" id="logisticsCanvasArea">
                    <!-- Background Environment -->
                    <div class="logistics-bg-warehouse" aria-hidden="true"></div>

                    <!-- Left Zone: Cargo Delivery Truck -->
                    <div class="logistics-truck-zone" id="logisticsTruckZone">
                        <div class="logistics-truck-target-indicator" id="truckTargetIndicator">
                            <span>🚛 여기에 하차! [<span data-game-key="a">${bindingLabel('a')}</span>]</span>
                        </div>
                        <!-- Generated truck with a live cargo overlay. -->
                        <svg class="logistics-truck-svg" width="280" height="200" viewBox="0 0 1478 1064" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                            <image href="${LOGISTICS_ASSETS.truck}" width="1478" height="1064" />
                            <g id="truckLoadedBoxesGroup"></g>
                        </svg>
                    </div>

                    <!-- Sensitivity / Damage Gauge -->
                    <div class="logistics-sensitivity-gauge-container" id="sensitivityGaugeContainer">
                        <span class="gauge-warning-icon" id="gaugeWarningIcon">⚠️</span>
                        <span class="gauge-title">파손<br>위험</span>
                        <div class="gauge-track">
                            <div class="gauge-fill" id="gaugeFillBar"></div>
                        </div>
                        <span class="gauge-percent-text" id="gaugePercentText">0%</span>
                    </div>

                    <!-- Right Zone: Stacked Package Boxes Pallet -->
                    <div class="logistics-boxes-zone" id="logisticsBoxesZone">
                        <div class="logistics-boxes-target-indicator" id="boxesTargetIndicator">
                            <span>📦 상자 집기 / 더 쌓기 [<span data-game-key="w">${bindingLabel('w')}</span>]</span>
                        </div>
                        <!-- Generated parcel pallet. -->
                        <img class="logistics-boxes-svg" src="${LOGISTICS_ASSETS.pallet}" width="200" height="220" alt="운반할 택배 상자 팔레트" draggable="false" />
                    </div>

                    <!-- Character Avatar on Ground -->
                    <div class="logistics-character carrying" id="logisticsCharacter">
                        <div class="logistics-char-avatar" id="logisticsCharAvatar">
                            ${createGeometricAvatarSVG({ shape: 'square', direction: 'left' })}
                        </div>
                        <!-- Multi-Box Stack Tower In Hands -->
                        <div class="logistics-char-box-tower" id="charBoxTower">
                            <!-- Populated dynamically based on carriedCount -->
                        </div>
                    </div>

                    <!-- Ground Floor -->
                    <div class="logistics-ground">
                        <div class="logistics-ground-stripes"></div>
                    </div>
                </div>

                <!-- Bottom Controls & Status Guide -->
                <div class="logistics-footer-bar">
                    <div class="logistics-controls-guide">
                        <span>🎮 <span class="logistics-key-chip">A</span> (트럭) / <span class="logistics-key-chip">D</span> (상자)</span>
                        <button class="btn-bottom-stack-more" id="btnBottomStackMore" title="상자 집기 / 더 쌓기">
                            <span>📦 상자 집기 / 쌓기 [<span data-game-key="w">${bindingLabel('w')}</span>]</span>
                        </button>
                        <span>⚡ 질주: <span class="logistics-key-chip" data-game-key="shift">${bindingLabel('shift')}</span></span>
                    </div>

                    <div class="logistics-current-state-badge carrying" id="charStateBadge">
                        <span>📦 1단 상자 운반 중 ➔ 트럭으로 이동하세요!</span>
                    </div>
                </div>

                <!-- Settlement Result Modal (S/A/B/C Grade) -->
                <div class="logistics-settlement-modal" id="logisticsSettlementModal">
                    <div class="settlement-card">
                        <div class="settlement-stamp grade-S" id="settlementStamp">S</div>
                        <div class="settlement-title">📦 작업 완료 및 급여 정산</div>
                        <div class="park-settlement-dialogue">
                            <img id="parkSettlementPortrait" src="assets/characters/manager-park/park-dialogue-neutral-v1.png" alt="관리소장 박씨" draggable="false">
                            <div class="settlement-subtitle" id="parkSettlementSpeech">관리소장 박씨: "60초 동안 수고 많았네. 정산 내역을 확인하게."</div>
                        </div>

                        <div class="settlement-table">
                            <div class="settlement-row">
                                <span class="settlement-row-label">운송 완료 화물</span>
                                <span class="settlement-row-value" id="resLoadedCount">0 개</span>
                            </div>
                            <div class="settlement-row">
                                <span class="settlement-row-label">파손 화물 수</span>
                                <span class="settlement-row-value" id="resBrokenCount" style="color: #ef4444;">0 개</span>
                            </div>
                            <div class="settlement-row">
                                <span class="settlement-row-label">최종 달성 등급</span>
                                <span class="settlement-row-value" id="resFinalGrade" style="color: #00e5ff;">S (Excellent)</span>
                            </div>
                            <div class="settlement-row" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
                                <span class="settlement-row-label">지급 급여 (골드)</span>
                                <span class="settlement-row-value gold" id="resRewardGold">+ 800 G</span>
                            </div>
                            <div class="settlement-row">
                                <span class="settlement-row-label">획득 경험치 (EXP)</span>
                                <span class="settlement-row-value exp" id="resRewardExp">+ 100 EXP</span>
                            </div>
                        </div>

                        <!-- Rumor Bonus Card (If acquired) -->
                        <div class="settlement-bonus-card" id="settlementBonusCard">
                            <span class="bonus-icon">💌</span>
                            <div class="bonus-text-group">
                                <div class="bonus-text-title">특급 찌라시 정보 획득!</div>
                                <div class="bonus-text-desc" id="resBonusDesc">물류센터 동료 트레이더로부터 익명 찌라시 메일을 수신했습니다.</div>
                            </div>
                        </div>

                        <button class="settlement-btn" id="btnConfirmSettlement">급여 수령 및 복귀</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
