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

import { getLogisticsModalHtml } from './logistics/LogisticsTemplate.js';
import { calculateLogisticsGrade, calculateLogisticsSettlement } from './logistics/LogisticsRewardEngine.js';
import { LogisticsAudio } from './logistics/LogisticsAudio.js';
import { LogisticsPhysicsEngine } from './logistics/LogisticsPhysicsEngine.js';
import { LogisticsRenderer } from './logistics/LogisticsRenderer.js';
import { ParkLogisticsTutorial } from './ParkLogisticsTutorial.js';

export class LogisticsMiniGame {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks; // { onComplete: (result) => {}, onClose: () => {} }

        // Game State Variables
        this.isOpen = false;
        this.isRunning = false;
        this.isGameOver = false;
        this.hasSeenTutorial = false;
        this.completedJobsCount = 0;
        this.userNickname = '신입';

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

        // Audio & Physics Engine
        this.audio = new LogisticsAudio();
        this.physics = new LogisticsPhysicsEngine({
            onCrash: () => this.triggerCrash(),
            onTurnShock: () => this.audio.playTurnShock()
        });
        this.physics.minX = 180;
        this.physics.maxX = 860;
        this.physics.baseSpeed = 260;
        this.physics.dashMultiplier = 1.85;

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    playTone(freq, duration = 0.1, type = 'sine', vol = 0.2) {
        this.audio.playTone(freq, duration, type, vol);
    }

    render() {
        this.container.insertAdjacentHTML('beforeend', getLogisticsModalHtml());
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
        this.btnGuide = document.getElementById('btnLogisticsGuide');

        // Initialize Manager Park Visual Novel Tutorial
        this.parkTutorial = new ParkLogisticsTutorial(this.container, {
            onComplete: () => {
                this.hasSeenTutorial = true;
                this.startSession();
            },
            onSkip: () => {
                this.hasSeenTutorial = true;
                this.startSession();
            }
        });
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnGuide?.addEventListener('click', () => this.startTutorial());
        this.btnConfirmSettlement?.addEventListener('click', () => this.finishAndClaimReward());
        this.boxesTargetIndicator?.addEventListener('click', () => this.tryStackBox());
        this.logisticsBoxesZone?.addEventListener('click', () => this.tryStackBox());
        this.btnBottomStackMore?.addEventListener('click', () => this.tryStackBox());

        window.addEventListener('keydown', (e) => {
            if (!this.isOpen || this.isGameOver || this.parkTutorial?.isActive) return;
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

    startTutorial() {
        // Pause timer & game physics
        this.isRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.keysHeld.clear();
        this.parkTutorial?.start(this.userNickname || '신입');
    }

    open(options = {}) {
        if (options.userNickname) {
            this.userNickname = options.userNickname;
        }
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

        // If first time or explicitly requested, run Manager Park's Tutorial
        if (!this.hasSeenTutorial || options.forceTutorial) {
            this.startTutorial();
        } else {
            this.startSession();
        }
    }

    close() {
        this.isOpen = false;
        this.isRunning = false;
        if (this.parkTutorial?.isActive) {
            this.parkTutorial.skip();
        }
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
        this.physics.updateMovement(this, dt);
    }

    updateSensitivity(dt) {
        this.physics.updateSensitivity(this, dt);

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
        if (this.stackCooldown > 0) return;

        // Expanded generous hitbox: Right side warehouse pallet area
        if (this.charX >= this.boxesZoneX - 100) {
            if (!this.hasBox || this.carriedCount === 0) {
                // First box pickup!
                this.carriedCount = 1;
                this.hasBox = true;
                this.damageGauge = 0;
                this.stackCooldown = 0.3;
                this.playTone(520, 0.15, 'triangle', 0.3);

                const pop = document.createElement('div');
                pop.className = 'logistics-success-fx';
                pop.textContent = '📦 상자 1단 적재! [W 키로 더 쌓기]';
                pop.style.left = `${this.charX - 30}px`;
                pop.style.bottom = `180px`;
                this.canvasArea.appendChild(pop);
                setTimeout(() => pop.remove(), 800);

                this.updateCharacterVisual();
            } else if (this.carriedCount < this.maxStack) {
                // Additional stack!
                this.carriedCount++;
                this.hasBox = true;
                this.stackCooldown = 0.3;

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
                // Already max stack (4)
                this.playTone(320, 0.1, 'sine', 0.2);
                const pop = document.createElement('div');
                pop.className = 'logistics-success-fx';
                pop.textContent = '⚠️ 이미 최대 4단 풀스택입니다! [A] 트럭으로 이동하세요.';
                pop.style.color = '#f59e0b';
                pop.style.left = `${this.charX - 30}px`;
                pop.style.bottom = `180px`;
                this.canvasArea.appendChild(pop);
                setTimeout(() => pop.remove(), 800);
            }
        } else {
            // Not near pallet
            this.playTone(220, 0.08, 'sine', 0.15);
            const pop = document.createElement('div');
            pop.className = 'logistics-success-fx';
            pop.textContent = '📍 우측 파렛트로 이동 후 [W / Space] 키를 누르세요!';
            pop.style.color = '#94a3b8';
            pop.style.fontSize = '12px';
            pop.style.left = `${this.charX - 40}px`;
            pop.style.bottom = `180px`;
            this.canvasArea.appendChild(pop);
            setTimeout(() => pop.remove(), 800);
        }
    }

    checkTriggers() {
        // Left zone: Truck Cargo Gate -> Unload All Stacked Boxes
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
        LogisticsRenderer.updateCharacterVisual(this);
    }

    updateTruckBoxesGraphic() {
        LogisticsRenderer.updateTruckBoxesGraphic(this.truckLoadedBoxesGroup, this.loadedCount);
    }

    updateHUD() {
        this.timerText.textContent = `${this.timeLeft}s`;
        this.loadedText.textContent = `${this.loadedCount} / 18`;
        this.brokenText.textContent = `${this.brokenCount}`;

        const currentGrade = calculateLogisticsGrade(this.loadedCount);
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

        const isFirstTime = this.completedJobsCount === 0;
        const result = calculateLogisticsSettlement(this.loadedCount, this.brokenCount, isFirstTime);
        this.completedJobsCount++;
        const { grade, goldReward, expReward, hasRumor, isJackpot, gradeLabel } = result;

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
            if (this.resBonusDesc) {
                this.resBonusDesc.textContent = '비트 물류 현장 동료로부터 주가 변동 복선이 담긴 익명 찌라시를 스마트폰으로 수신했습니다!';
            }
        } else {
            this.settlementBonusCard.classList.remove('active');
        }

        this.lastResult = result;

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
