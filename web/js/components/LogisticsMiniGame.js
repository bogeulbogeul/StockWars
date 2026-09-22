/**
 * LogisticsMiniGame Component
 * 2D Side-View Bit Logistics Cargo Delivery Mini-Game
 * GDD Reference: MOD_GDD_02_LaborJobs.md (v2.25.0)
 * Core Loop:
 * 1. [Right] Pickup package from stacked box pallet -> hasBox = true
 * 2. [Center] Move with [A] / [D] keys + [Shift] dash -> Balance sensitivity/damage gauge
 * 3. [Left] Reach Cargo Truck -> unload package -> loadedCount++ -> return empty-handed
 * 4. 60-Second Timer -> Settlement Modal (Grade S/A/B/C + Gold/EXP + Rumor info)
 */

import { createGeometricAvatarSVG } from './GeometricAvatar.js';

export class LogisticsMiniGame {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onComplete: (result) => {}, onClose: () => {} }

        // Game State Variables
        this.isOpen = false;
        this.isRunning = false;
        this.isGameOver = false;

        // Session Specs (GDD)
        this.sessionDuration = 60; // 60 seconds
        this.timeLeft = this.sessionDuration;
        this.loadedCount = 0;
        this.brokenCount = 0;

        // Player Physical Position & Movement
        this.minX = 180; // Left boundary (Truck cargo gate)
        this.maxX = 860; // Right boundary (Stacked boxes pallet)
        this.truckZoneX = 280; // Expanded truck unload trigger zone
        this.boxesZoneX = 660; // Expanded boxes pickup/stack trigger zone
        this.charX = 760; // Start at right box pallet
        this.charFacing = -1; // -1: Left (towards truck), 1: Right (towards boxes)
        this.velocityX = 0;
        this.baseSpeed = 260; // px/sec
        this.dashMultiplier = 1.85;

        // Package Multi-Stack & Damage Sensitivity State
        this.carriedCount = 1; // 0: empty hands, 1~4: stacked boxes
        this.maxStack = 4; // Max carry stack
        this.stackCooldown = 0; // Cooldown between adding stacks
        this.lastRenderedStack = -1; // Cache for DOM performance
        this.hasBox = true; // Initial box in hands ready to start
        this.damageGauge = 0; // 0% to 100%
        this.wobbleAngle = 0;

        // Input Tracking
        this.keysHeld = new Set();
        this.lastTimestamp = performance.now();
        this.animFrameId = null;
        this.timerInterval = null;

        // Sound / Audio FX Synth (Web Audio API for rich game feel)
        this.audioCtx = null;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playTone(freq, duration = 0.1, type = 'sine', vol = 0.2) {
        try {
            if (!this.audioCtx) this.initAudio();
            if (!this.audioCtx || this.audioCtx.state === 'suspended') {
                this.audioCtx?.resume();
            }
            if (!this.audioCtx) return;

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            // Audio ignore on restriction
        }
    }

    render() {
        const modalHtml = `
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
                                <span class="logistics-stat-value" id="logisticsLoadedText">0 / 10</span>
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

                        <button class="logistics-close-btn" id="btnLogisticsClose" title="작업 중단 및 나가기">✕</button>
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

                        <!-- Sensitivity / Damage Gauge (User Sketch Left Top) -->
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
                                <span>📦 상자 집기 / 더 쌓기! [D • W]</span>
                            </div>
                            <!-- Vector Stacked Boxes SVG -->
                            <svg class="logistics-boxes-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                                <!-- Wooden Pallet Base -->
                                <rect x="10" y="190" width="180" height="18" rx="3" fill="#854d0e" stroke="#451a03" stroke-width="3"/>
                                <rect x="30" y="196" width="30" height="8" fill="#451a03"/>
                                <rect x="85" y="196" width="30" height="8" fill="#451a03"/>
                                <rect x="140" y="196" width="30" height="8" fill="#451a03"/>

                                <!-- Stack of Cardboard Boxes -->
                                <!-- Bottom Row -->
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

                                <!-- Middle Row -->
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

                                <!-- Top Row Single Box -->
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
                            <button class="btn-bottom-stack-more" id="btnBottomStackMore" title="상자 1개 더 쌓기">
                                <span>📦 상자 +1단 쌓기 [W / Space]</span>
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

        this.container.insertAdjacentHTML('beforeend', modalHtml);
    }

    initDOM() {
        this.overlay = document.getElementById('logisticsModalOverlay');
        this.timerText = document.getElementById('logisticsTimerText');
        this.loadedText = document.getElementById('logisticsLoadedText');
        this.gradeText = document.getElementById('logisticsGradeText');
        this.brokenText = document.getElementById('logisticsBrokenText');
        this.canvasArea = document.getElementById('logisticsCanvasArea');
        this.characterEl = document.getElementById('logisticsCharacter');
        this.charAvatarEl = document.getElementById('logisticsCharAvatar');
        this.charBoxTower = document.getElementById('charBoxTower');
        this.gaugeFillBar = document.getElementById('gaugeFillBar');
        this.gaugePercentText = document.getElementById('gaugePercentText');
        this.gaugeWarningIcon = document.getElementById('gaugeWarningIcon');
        this.charStateBadge = document.getElementById('charStateBadge');
        this.truckLoadedBoxesGroup = document.getElementById('truckLoadedBoxesGroup');
        this.truckTargetIndicator = document.getElementById('truckTargetIndicator');
        this.boxesTargetIndicator = document.getElementById('boxesTargetIndicator');
        this.logisticsBoxesZone = document.getElementById('logisticsBoxesZone');
        this.btnBottomStackMore = document.getElementById('btnBottomStackMore');

        // Settlement Elements
        this.settlementModal = document.getElementById('logisticsSettlementModal');
        this.settlementStamp = document.getElementById('settlementStamp');
        this.resLoadedCount = document.getElementById('resLoadedCount');
        this.resBrokenCount = document.getElementById('resBrokenCount');
        this.resFinalGrade = document.getElementById('resFinalGrade');
        this.resRewardGold = document.getElementById('resRewardGold');
        this.resRewardExp = document.getElementById('resRewardExp');
        this.settlementBonusCard = document.getElementById('settlementBonusCard');
        this.resBonusDesc = document.getElementById('resBonusDesc');
        this.btnConfirmSettlement = document.getElementById('btnConfirmSettlement');
        this.btnClose = document.getElementById('btnLogisticsClose');
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnConfirmSettlement?.addEventListener('click', () => this.finishAndClaimReward());
        this.boxesTargetIndicator?.addEventListener('click', () => this.tryStackBox());
        this.logisticsBoxesZone?.addEventListener('click', () => this.tryStackBox());
        this.btnBottomStackMore?.addEventListener('click', () => this.tryStackBox());

        window.addEventListener('keydown', (e) => {
            if (!this.isOpen || this.isGameOver) return;
            const code = e.code || '';
            const k = (e.key || '').toLowerCase();

            const isLeft = code === 'KeyA' || code === 'ArrowLeft' || k === 'a' || k === 'ㅁ' || k === 'arrowleft';
            const isRight = code === 'KeyD' || code === 'ArrowRight' || k === 'd' || k === 'ㅇ' || k === 'arrowright';
            const isShift = code === 'ShiftLeft' || code === 'ShiftRight' || e.shiftKey || k === 'shift';
            const isStack = code === 'KeyW' || code === 'KeyE' || code === 'KeyF' || code === 'Space' || code === 'ArrowUp' ||
                            k === 'w' || k === 'e' || k === 'f' || k === ' ' || k === 'ㅈ' || k === 'ㄷ' || k === 'ㄹ' || k === 'arrowup';

            if (isLeft) {
                this.keysHeld.add('left');
            }
            if (isRight) {
                this.keysHeld.add('right');
                // If already at pallet, tapping right also stacks boxes!
                if (this.charX >= this.boxesZoneX - 40 && this.carriedCount < this.maxStack) {
                    this.tryStackBox();
                }
            }
            if (isShift) {
                this.keysHeld.add('shift');
            }
            if (isStack) {
                this.tryStackBox();
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code || '';
            const k = (e.key || '').toLowerCase();

            const isLeft = code === 'KeyA' || code === 'ArrowLeft' || k === 'a' || k === 'ㅁ' || k === 'arrowleft';
            const isRight = code === 'KeyD' || code === 'ArrowRight' || k === 'd' || k === 'ㅇ' || k === 'arrowright';
            const isShift = code === 'ShiftLeft' || code === 'ShiftRight' || !e.shiftKey || k === 'shift';

            if (isLeft) {
                this.keysHeld.delete('left');
            }
            if (isRight) {
                this.keysHeld.delete('right');
            }
            if (isShift) {
                this.keysHeld.delete('shift');
            }
        });
    }

    open() {
        this.isOpen = true;
        this.isGameOver = false;
        this.timeLeft = this.sessionDuration;
        this.loadedCount = 0;
        this.brokenCount = 0;
        this.damageGauge = 0;
        this.charX = 780; // Start at box pallet
        this.carriedCount = 1; // Start with 1 box
        this.hasBox = true; // Initial box in hands
        this.stackCooldown = 0;
        this.charFacing = -1; // Facing truck
        this.keysHeld.clear();
        this.settlementModal.classList.remove('active');
        this.overlay.classList.add('active');

        this.updateHUD();
        this.updateCharacterVisual();
        this.updateTruckBoxesGraphic();
        this.startSession();
    }

    close() {
        this.isOpen = false;
        this.isRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.overlay.classList.remove('active');
        this.settlementModal.classList.remove('active');
        if (this.callbacks.onClose) this.callbacks.onClose();
    }

    startSession() {
        this.isRunning = true;
        this.lastTimestamp = performance.now();

        // 60-Second Countdown Timer
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isRunning || this.isGameOver) return;
            this.timeLeft--;
            this.updateHUD();

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.endSession();
            }
        }, 1000);

        // Game Loop Animation Frame
        this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(now) {
        if (!this.isOpen) return;

        const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1);
        this.lastTimestamp = now;

        if (this.isRunning && !this.isGameOver) {
            this.updatePhysics(dt);
            this.updateSensitivity(dt);
            this.checkTriggers();
            this.updateCharacterVisual();
        }

        this.animFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    updatePhysics(dt) {
        if (this.stackCooldown > 0) {
            this.stackCooldown -= dt;
        }

        let moveDir = 0;
        if (this.keysHeld.has('left')) moveDir -= 1;
        if (this.keysHeld.has('right')) moveDir += 1;

        const isDashing = this.keysHeld.has('shift');
        let speed = this.baseSpeed * (isDashing ? this.dashMultiplier : 1.0);

        // If carrying boxes, weight penalty increases with stack count
        if (this.hasBox && this.carriedCount > 0) {
            speed *= Math.max(0.65, 1.0 - (this.carriedCount * 0.08));
        } else {
            // Empty-handed return speed boost!
            speed *= 1.2;
        }

        if (moveDir !== 0) {
            const oldFacing = this.charFacing;
            this.charFacing = moveDir;
            // Quick turn jolt while carrying boxes increases damage proportionally to stack!
            if (this.hasBox && oldFacing !== moveDir && Math.abs(this.velocityX) > 100) {
                const turnShock = 12 + (this.carriedCount * 6);
                this.damageGauge = Math.min(100, this.damageGauge + turnShock);
                this.playTone(180, 0.08, 'sawtooth', 0.2);
            }
        }

        const targetVel = moveDir * speed;
        // Smooth acceleration/damping
        this.velocityX += (targetVel - this.velocityX) * (dt * 12);

        this.charX += this.velocityX * dt;

        // Clamping to track
        if (this.charX < this.minX) {
            this.charX = this.minX;
            this.velocityX = 0;
        }
        if (this.charX > this.maxX) {
            this.charX = this.maxX;
            this.velocityX = 0;
        }
    }

    updateSensitivity(dt) {
        if (!this.hasBox || this.carriedCount === 0) {
            // Empty-handed: gauge rapidly cools down to 0%
            this.damageGauge = Math.max(0, this.damageGauge - dt * 120);
            this.wobbleAngle = 0;
        } else {
            // Multi-stack sensitivity multiplier (High Risk & High Return!)
            // 1 box: 1.0x, 2 boxes: 2.15x, 3 boxes: 3.3x, 4 boxes: 4.45x
            const stackFactor = 1.0 + (this.carriedCount - 1) * 1.15;
            const isMoving = Math.abs(this.velocityX) > 20;
            const isDashing = this.keysHeld.has('shift');

            if (isDashing && isMoving) {
                // High risk dash build-up (Significantly intensified)
                this.damageGauge += dt * 62 * stackFactor;
                this.wobbleAngle = Math.sin(performance.now() * 0.024) * (10 + this.carriedCount * 7.5);
            } else if (isMoving) {
                // Normal walk build-up (Intensified for higher stacks)
                this.damageGauge += dt * 22 * stackFactor;
                this.wobbleAngle = Math.sin(performance.now() * 0.015) * (6 + this.carriedCount * 5.5);
            } else {
                // Standing still / catching breath cools down gauge (slower with heavier stacks)
                const coolRate = 40 / Math.sqrt(this.carriedCount);
                this.damageGauge = Math.max(0, this.damageGauge - dt * coolRate);
                this.wobbleAngle = Math.sin(performance.now() * 0.008) * (2 + this.carriedCount * 1.5);
            }

            // Cap at 100
            if (this.damageGauge >= 100) {
                this.damageGauge = 100;
                this.triggerCrash();
            }
        }

        // Update Gauge UI
        const pct = Math.round(this.damageGauge);
        this.gaugeFillBar.style.height = `${pct}%`;
        this.gaugePercentText.textContent = `${pct}%`;

        if (pct >= 70) {
            this.gaugeWarningIcon.classList.add('active');
            this.gaugeFillBar.style.boxShadow = '0 0 18px #ef4444';
        } else {
            this.gaugeWarningIcon.classList.remove('active');
            this.gaugeFillBar.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.4)';
        }
    }

    triggerCrash() {
        const lost = this.carriedCount;
        this.hasBox = false;
        this.carriedCount = 0;
        this.brokenCount += lost;
        this.damageGauge = 0;

        this.playTone(110, 0.4, 'sawtooth', 0.45);

        // Spawn Crash FX
        const crashFx = document.createElement('div');
        crashFx.className = 'logistics-crash-fx';
        crashFx.textContent = lost > 1 ? `💥 CRASH! 화물 ${lost}개 와르르 파손!` : '💥 CRASH! 화물 파손!';
        crashFx.style.left = `${this.charX - 40}px`;
        crashFx.style.bottom = `180px`;
        this.canvasArea.appendChild(crashFx);
        setTimeout(() => crashFx.remove(), 900);

        this.updateHUD();
        this.updateCharacterVisual();
    }

    tryStackBox() {
        if (!this.isOpen || this.isGameOver || !this.isRunning) return;

        // Expanded generous hitbox: Right side warehouse area
        if (this.charX >= this.boxesZoneX - 100) {
            if (this.carriedCount < this.maxStack) {
                this.carriedCount++;
                this.hasBox = true;
                this.stackCooldown = 0.35;

                const pitch = 440 + this.carriedCount * 130;
                this.playTone(pitch, 0.15, 'triangle', 0.3);

                const pop = document.createElement('div');
                pop.className = 'logistics-success-fx';
                if (this.carriedCount === this.maxStack) {
                    pop.textContent = `🔥 ${this.carriedCount}단 풀스택! (초고위험)`;
                    pop.style.color = '#ef4444';
                } else {
                    pop.textContent = `📦 ${this.carriedCount}단 적재 완료!`;
                }
                pop.style.left = `${this.charX - 30}px`;
                pop.style.bottom = `180px`;
                this.canvasArea.appendChild(pop);
                setTimeout(() => pop.remove(), 800);

                this.updateCharacterVisual();
            } else {
                this.playTone(320, 0.1, 'sine', 0.2);
            }
        }
    }

    checkTriggers() {
        // 1. Right zone: Package Boxes Pallet
        if (this.charX >= this.boxesZoneX) {
            if (!this.hasBox || this.carriedCount === 0) {
                // Empty-handed -> auto pick first box
                this.carriedCount = 1;
                this.hasBox = true;
                this.damageGauge = 0;
                this.stackCooldown = 0.4;
                this.playTone(520, 0.12, 'triangle', 0.25);

                const pop = document.createElement('div');
                pop.className = 'logistics-success-fx';
                pop.textContent = '📦 상자 1단 픽업! [W 키로 더 쌓기]';
                pop.style.left = `${this.charX - 30}px`;
                pop.style.bottom = `180px`;
                this.canvasArea.appendChild(pop);
                setTimeout(() => pop.remove(), 800);

                this.updateCharacterVisual();
            } else if (this.carriedCount < this.maxStack && (this.keysHeld.has('right') || this.keysHeld.has('up')) && this.stackCooldown <= 0) {
                // Holding Right/Up at pallet automatically stacks more!
                this.tryStackBox();
            }
        }

        // 2. Left zone: Truck Cargo Gate -> Unload All Stacked Boxes
        if (this.hasBox && this.carriedCount > 0 && this.charX <= this.truckZoneX) {
            const delivered = this.carriedCount;
            this.loadedCount += delivered;
            this.hasBox = false;
            this.carriedCount = 0;
            this.damageGauge = 0;

            // Arpeggio audio fanfare based on delivered count!
            this.playTone(659, 0.12, 'sine', 0.3);
            setTimeout(() => this.playTone(784, 0.15, 'sine', 0.35), 80);
            if (delivered >= 3) {
                setTimeout(() => this.playTone(1046, 0.25, 'triangle', 0.4), 160);
            }

            // Pop loaded score
            const pop = document.createElement('div');
            pop.className = 'logistics-success-fx';
            pop.textContent = delivered > 1 
                ? `🚛 대량 하차 성공! (+${delivered}개 적재, 총 ${this.loadedCount}개)`
                : `🚛 적재 성공! (${this.loadedCount}개)`;
            pop.style.left = `${this.charX - 20}px`;
            pop.style.bottom = `180px`;
            this.canvasArea.appendChild(pop);
            setTimeout(() => pop.remove(), 800);

            this.updateHUD();
            this.updateTruckBoxesGraphic();
            this.updateCharacterVisual();
        }
    }

    updateCharacterVisual() {
        this.characterEl.style.left = `${this.charX}px`;

        // Flip avatar based on facing
        const scaleX = this.charFacing === 1 ? -1 : 1;
        this.characterEl.style.transform = `scaleX(${scaleX})`;

        if (this.hasBox && this.carriedCount > 0) {
            this.characterEl.classList.add('carrying');

            // Rebuild DOM only when stack count changes for smooth 60fps
            if (this.lastRenderedStack !== this.carriedCount) {
                this.lastRenderedStack = this.carriedCount;
                let towerHtml = '';
                for (let i = 1; i <= this.carriedCount; i++) {
                    towerHtml += `
                        <div class="char-box-item level-${i}" id="charBoxLevel_${i}">
                            📦
                        </div>
                    `;
                }
                towerHtml += `
                    <div class="char-stack-badge stack-${this.carriedCount}">
                        ${this.carriedCount === this.maxStack ? '🔥 MAX STACK' : `x${this.carriedCount} STACK`}
                    </div>
                `;
                this.charBoxTower.innerHTML = towerHtml;
            }

            // Update box tilt per frame
            for (let i = 1; i <= this.carriedCount; i++) {
                const boxItem = document.getElementById(`charBoxLevel_${i}`);
                if (boxItem) {
                    const tilt = this.wobbleAngle * (0.8 + (i - 1) * 0.45);
                    boxItem.style.transform = `rotate(${tilt}deg)`;
                }
            }

            this.charStateBadge.className = 'logistics-current-state-badge carrying';
            this.charStateBadge.innerHTML = `<span>📦 ${this.carriedCount}단 상자 운반 중 ➔ [A] 트럭으로 이동하세요!</span>`;
            this.truckTargetIndicator.style.opacity = '1';
            
            if (this.carriedCount < this.maxStack) {
                this.boxesTargetIndicator.style.opacity = '1';
                this.boxesTargetIndicator.innerHTML = `<span>📦 상자 더 쌓기! [W • Space] (${this.carriedCount}/${this.maxStack}단)</span>`;
            } else {
                this.boxesTargetIndicator.style.opacity = '0.4';
                this.boxesTargetIndicator.innerHTML = `<span>🔥 ${this.maxStack}단 풀스택 완료! ➔ [A] 트럭 하차</span>`;
            }
        } else {
            this.characterEl.classList.remove('carrying');
            if (this.lastRenderedStack !== 0) {
                this.lastRenderedStack = 0;
                this.charBoxTower.innerHTML = '';
            }
            this.charStateBadge.className = 'logistics-current-state-badge empty';
            this.charStateBadge.innerHTML = '<span>🖐️ 빈손 귀환 중 ➔ [D] 우측 상자 무더기로 이동!</span>';
            this.truckTargetIndicator.style.opacity = '0.3';
            this.boxesTargetIndicator.style.opacity = '1';
            this.boxesTargetIndicator.innerHTML = '<span>📦 상자 집기! [D]</span>';
        }
    }

    updateTruckBoxesGraphic() {
        // Draw loaded cardboard boxes inside truck SVG
        let boxesSvg = '';
        const count = Math.min(this.loadedCount, 12);
        for (let i = 0; i < count; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = 90 + col * 28;
            const by = 175 - row * 26;
            boxesSvg += `
                <g transform="translate(${bx}, ${by})">
                    <rect width="25" height="23" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
                    <line x1="0" y1="8" x2="25" y2="8" stroke="#b45309" stroke-width="1" />
                </g>
            `;
        }
        this.truckLoadedBoxesGroup.innerHTML = boxesSvg;
    }

    calculateGrade() {
        if (this.loadedCount >= 10) return 'S';
        if (this.loadedCount >= 7) return 'A';
        if (this.loadedCount >= 4) return 'B';
        return 'C';
    }

    updateHUD() {
        this.timerText.textContent = `${this.timeLeft}s`;
        this.loadedText.textContent = `${this.loadedCount} / 10`;
        this.brokenText.textContent = `${this.brokenCount}`;

        const currentGrade = this.calculateGrade();
        this.gradeText.textContent = currentGrade;
        if (currentGrade === 'S') this.gradeText.style.color = '#ec4899';
        else if (currentGrade === 'A') this.gradeText.style.color = '#00e5ff';
        else if (currentGrade === 'B') this.gradeText.style.color = '#10b981';
        else this.gradeText.style.color = '#94a3b8';
    }

    endSession() {
        this.isRunning = false;
        this.isGameOver = true;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const grade = this.calculateGrade();
        let goldReward = 100;
        let expReward = 10;
        let rumorChance = 0;
        let gradeLabel = 'C (Below / 기본 수고비)';

        if (grade === 'S') {
            goldReward = 800;
            expReward = 100;
            rumorChance = 0.30;
            gradeLabel = 'S (Excellent / 특급 기여)';
        } else if (grade === 'A') {
            goldReward = 560;
            expReward = 70;
            rumorChance = 0.15;
            gradeLabel = 'A (Good / 우수 기여)';
        } else if (grade === 'B') {
            goldReward = 320;
            expReward = 40;
            rumorChance = 0.05;
            gradeLabel = 'B (Normal / 보통)';
        }

        // Check Golden Jackpot (0.002% on S Grade)
        let isJackpot = false;
        if (grade === 'S' && Math.random() < 0.00002) {
            goldReward = 8000;
            isJackpot = true;
        }

        // Check Rumor Bonus
        const hasRumor = Math.random() < rumorChance;

        // Update Settlement Card
        this.settlementStamp.className = `settlement-stamp grade-${grade}`;
        this.settlementStamp.textContent = grade;
        this.resLoadedCount.textContent = `${this.loadedCount} 개`;
        this.resBrokenCount.textContent = `${this.brokenCount} 개`;
        this.resFinalGrade.textContent = gradeLabel;
        this.resFinalGrade.style.color = grade === 'S' ? '#ec4899' : (grade === 'A' ? '#00e5ff' : (grade === 'B' ? '#10b981' : '#94a3b8'));
        this.resRewardGold.textContent = isJackpot ? `+ ${goldReward.toLocaleString()} G (10배 잭팟!)` : `+ ${goldReward.toLocaleString()} G`;
        this.resRewardExp.textContent = `+ ${expReward} EXP`;

        if (hasRumor) {
            this.settlementBonusCard.classList.add('active');
            this.resBonusDesc.textContent = '비트 물류 현장 동료로부터 주가 변동 복선이 담긴 익명 찌라시를 스마트폰으로 수신했습니다!';
        } else {
            this.settlementBonusCard.classList.remove('active');
        }

        this.lastResult = {
            grade,
            goldReward,
            expReward,
            hasRumor,
            loadedCount: this.loadedCount,
            brokenCount: this.brokenCount
        };

        this.playTone(587, 0.2, 'sine', 0.3);
        setTimeout(() => this.playTone(880, 0.3, 'triangle', 0.4), 220);

        this.settlementModal.classList.add('active');
    }

    finishAndClaimReward() {
        if (this.callbacks.onComplete && this.lastResult) {
            this.callbacks.onComplete(this.lastResult);
        }
        this.close();
    }
}
