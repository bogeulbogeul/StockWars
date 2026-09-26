/**
 * LogisticsTemplate
 * Generates the HTML markup and SVG scene templates for the Bit Logistics Mini-Game modal.
 * GDD Reference: MOD_GDD_02_LaborJobs.md
 */

import { createGeometricAvatarSVG } from '../GeometricAvatar.js';

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
                            <span class="logistics-stat-label">적재 화물:</span>
                            <span class="logistics-stat-value" id="logisticsLoadedText">0 / 18</span>
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

                    <div class="logistics-controls-group" style="display: flex; align-items: center; gap: 8px;">
                        <button class="logistics-guide-btn" id="btnLogisticsGuide" title="관리소장 박씨 튜토리얼 가이드">💡 박씨 가이드</button>
                        <button class="logistics-close-btn" id="btnLogisticsClose" title="작업 중단 및 나가기">✕</button>
                    </div>
                </div>

                <!-- News Ticker -->
                <div class="logistics-ticker-bar">
                    <span class="logistics-ticker-badge">속보 TICKER</span>
                    <div class="logistics-ticker-text" id="logisticsTickerText">
                        ⚡ [속보] 글로벌 반도체 공급망 개편 소식에 IT 섹터 강세 지속 • 비트 물류 HUB 야간 화물 물동량 25% 급증 • 비비안 잡화점 에너지 드링크 재입고 완료!
                    </div>
                </div>

                <!-- 2D Gameplay Viewport -->
                <div class="logistics-game-canvas-area" id="logisticsCanvasArea">
                    <!-- Background Environment -->
                    <div class="logistics-bg-warehouse">
                        <div class="logistics-bg-racks"></div>
                        <div class="logistics-bg-light-cone" style="left: 120px;"></div>
                        <div class="logistics-bg-light-cone" style="left: 680px;"></div>
                    </div>

                    <!-- Left Zone: Cargo Delivery Truck -->
                    <div class="logistics-truck-zone" id="logisticsTruckZone">
                        <div class="logistics-truck-target-indicator" id="truckTargetIndicator">
                            <span>🚛 여기에 하차! [A]</span>
                        </div>
                        <!-- Vector Truck SVG -->
                        <svg class="logistics-truck-svg" viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="truckBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#1e293b"/>
                                    <stop offset="100%" stop-color="#0f172a"/>
                                </linearGradient>
                                <linearGradient id="truckCargoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#334155"/>
                                    <stop offset="100%" stop-color="#1e293b"/>
                                </linearGradient>
                            </defs>
                            <!-- Truck Cab (Front) -->
                            <path d="M 30 140 L 60 140 L 75 170 L 75 220 L 15 220 L 15 160 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="3" />
                            <rect x="35" y="148" width="22" height="18" rx="3" fill="#bae6fd" opacity="0.8" />
                            <circle cx="45" cy="225" r="16" fill="#0f172a" stroke="#64748b" stroke-width="4" />
                            
                            <!-- Truck Cargo Container (Back Open Gate) -->
                            <rect x="75" y="70" width="150" height="150" rx="8" fill="url(#truckCargoGrad)" stroke="#f59e0b" stroke-width="4" />
                            <!-- Inside Cargo Area (Dark Depth) -->
                            <rect x="85" y="80" width="130" height="130" rx="4" fill="#070b12" />
                            
                            <!-- Dynamic Loaded Boxes Inside Truck -->
                            <g id="truckLoadedBoxesGroup">
                                <!-- Populated dynamically via JS -->
                            </g>

                            <!-- Truck Wheels -->
                            <circle cx="120" cy="225" r="16" fill="#0f172a" stroke="#64748b" stroke-width="4" />
                            <circle cx="190" cy="225" r="16" fill="#0f172a" stroke="#64748b" stroke-width="4" />

                            <!-- BIT LOGISTICS Logo on Truck -->
                            <rect x="90" y="85" width="60" height="14" rx="3" fill="#f59e0b" opacity="0.9"/>
                            <text x="94" y="96" font-size="9" font-weight="900" fill="#090e17">BIT HUB</text>
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
                            <span>📦 상자 집기 / 더 쌓기 [W • Space]</span>
                        </div>
                        <!-- Vector Stacked Boxes SVG -->
                        <svg class="logistics-boxes-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                            <!-- Wooden Pallet Base -->
                            <rect x="10" y="190" width="180" height="18" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="3"/>
                            <rect x="30" y="196" width="30" height="8" fill="#451a03"/>
                            <rect x="85" y="196" width="30" height="8" fill="#451a03"/>
                            <rect x="140" y="196" width="30" height="8" fill="#451a03"/>

                            <!-- Stack of Cardboard Boxes -->
                            <g transform="translate(18, 126)">
                                <rect width="52" height="60" rx="4" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="20" x2="52" y2="20" stroke="#b45309" stroke-width="2"/>
                                <rect x="12" y="30" width="16" height="10" fill="#fef3c7" opacity="0.8"/>
                            </g>
                            <g transform="translate(74, 126)">
                                <rect width="52" height="60" rx="4" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="20" x2="52" y2="20" stroke="#92400e" stroke-width="2"/>
                                <rect x="12" y="30" width="16" height="10" fill="#fef3c7" opacity="0.8"/>
                            </g>
                            <g transform="translate(130, 126)">
                                <rect width="52" height="60" rx="4" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="20" x2="52" y2="20" stroke="#b45309" stroke-width="2"/>
                                <rect x="12" y="30" width="16" height="10" fill="#fef3c7" opacity="0.8"/>
                            </g>
                            <g transform="translate(42, 62)">
                                <rect width="54" height="60" rx="4" fill="#f59e0b" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="20" x2="54" y2="20" stroke="#d97706" stroke-width="2"/>
                                <rect x="14" y="30" width="18" height="10" fill="#fef3c7" opacity="0.8"/>
                            </g>
                            <g transform="translate(102, 62)">
                                <rect width="54" height="60" rx="4" fill="#d97706" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="20" x2="54" y2="20" stroke="#b45309" stroke-width="2"/>
                                <rect x="14" y="30" width="18" height="10" fill="#fef3c7" opacity="0.8"/>
                            </g>
                            <g transform="translate(70, 0)">
                                <rect width="56" height="58" rx="4" fill="#fbbf24" stroke="#78350f" stroke-width="2.5"/>
                                <line x1="0" y1="18" x2="56" y2="18" stroke="#d97706" stroke-width="2"/>
                                <rect x="15" y="26" width="18" height="10" fill="#fef3c7" opacity="0.8"/>
                                <text x="12" y="48" font-size="8" font-weight="900" fill="#78350f">FRAGILE</text>
                            </g>
                        </svg>
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
                            <span>📦 상자 집기 / 쌓기 [W / Space]</span>
                        </button>
                        <span>⚡ 질주: <span class="logistics-key-chip">Shift</span></span>
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
                        <div class="settlement-subtitle">관리소장 박씨: "60초 동안 수고 많았네. 정산 내역을 확인하게."</div>

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
