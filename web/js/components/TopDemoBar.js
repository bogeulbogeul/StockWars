/**
 * TopDemoBar Component
 * Unity equivalent: TopDemoBarController.cs
 * Renders and manages the top demo control bar for presentations.
 */

import { timeOfDayService } from '../engine/timeOfDayService.js';

export class TopDemoBar {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.render();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="demoTopBar" class="demo-top-bar hidden">
                <div class="demo-branding">
                    <span class="demo-badge">StockWars Dev Mode</span>
                    <span class="demo-sub">스마트폰 & 주식 HTS 앱 개발자 모드</span>
                </div>
                <div class="demo-controls">
                    <button id="btnTitleScreen" class="demo-btn" title="타이틀 화면으로 돌아가기">
                        <span class="btn-icon">🏠</span> <span>타이틀 화면</span>
                    </button>
                    <button id="btnCycleTime" class="demo-btn special-btn" title="하늘 시간대 전환 (새벽 🌅 -> 낮 ☀️ -> 노을 🌇 -> 밤 🌙)">
                        <span class="btn-icon" id="iconDemoTime">☀️</span> <span id="txtDemoTime">낮</span>
                    </button>
                    <button id="btnToggleStage" class="demo-btn special-btn" title="오피스 ↔ 타운 맵 전환">
                        <span class="btn-icon">🏙️</span> <span id="txtStageToggle">타운으로 이동</span>
                    </button>
                    <button id="btnLogisticsDemo" class="demo-btn accent-btn" title="비트 물류 상하차 알바 바로 시작">
                        <span class="btn-icon">📦</span> <span>물류 알바 (60초)</span>
                    </button>
                    <button id="btnToggleFrame" class="demo-btn">
                        <span class="btn-icon">📱</span> <span id="txtFrameToggle">스마트폰 열기</span>
                    </button>
                    <button id="btnUnlockLevel20" class="demo-btn special-btn">
                        <span class="btn-icon">🔓</span> <span id="txtUnlockToggle">공매도/레버리지 해금 (Lv.20)</span>
                    </button>
                    <button id="btnFastForwardDay" class="demo-btn accent-btn">
                        <span class="btn-icon">⚡</span> 다음 날(Day +1)
                    </button>
                    <button id="btnTriggerSettlement" class="demo-btn warning-btn">
                        <span class="btn-icon">🧾</span> 7일차 정산 시연
                    </button>
                    <button id="btnResetDemo" class="demo-btn danger-btn">
                        <span class="btn-icon">🔄</span> 리셋
                    </button>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);

        this.element = document.getElementById('demoTopBar');
        this.btnTitleScreen = document.getElementById('btnTitleScreen');
        this.btnCycleTime = document.getElementById('btnCycleTime');
        this.iconDemoTime = document.getElementById('iconDemoTime');
        this.txtDemoTime = document.getElementById('txtDemoTime');
        this.btnToggleStage = document.getElementById('btnToggleStage');
        this.txtStageToggle = document.getElementById('txtStageToggle');
        this.btnToggleFrame = document.getElementById('btnToggleFrame');
        this.txtFrameToggle = document.getElementById('txtFrameToggle');
        this.btnUnlockLevel20 = document.getElementById('btnUnlockLevel20');
        this.txtUnlockToggle = document.getElementById('txtUnlockToggle');
        this.btnFastForwardDay = document.getElementById('btnFastForwardDay');
        this.btnTriggerSettlement = document.getElementById('btnTriggerSettlement');
        this.btnResetDemo = document.getElementById('btnResetDemo');
        this.btnLogisticsDemo = document.getElementById('btnLogisticsDemo');
    }

    initEventListeners() {
        this.btnTitleScreen?.addEventListener('click', () => {
            if (this.callbacks.onShowTitle) this.callbacks.onShowTitle();
        });

        this.btnCycleTime?.addEventListener('click', () => {
            timeOfDayService.cycleNext();
        });

        timeOfDayService.subscribe((_timeKey, meta) => {
            if (this.iconDemoTime) this.iconDemoTime.textContent = meta.icon;
            if (this.txtDemoTime) this.txtDemoTime.textContent = meta.label.split('/')[0].trim();
        });

        this.btnToggleStage?.addEventListener('click', () => {
            if (this.callbacks.onToggleStage) this.callbacks.onToggleStage();
        });

        this.btnLogisticsDemo?.addEventListener('click', () => {
            if (this.callbacks.onOpenLogistics) this.callbacks.onOpenLogistics();
        });

        this.btnToggleFrame?.addEventListener('click', () => {
            if (this.callbacks.onToggleFrame) {
                this.callbacks.onToggleFrame();
            } else {
                document.body.classList.remove('phone-minimized');
                document.body.classList.toggle('phone-view-active');
                const isActive = document.body.classList.contains('phone-view-active');
                if (this.txtFrameToggle) {
                    this.txtFrameToggle.textContent = isActive ? '전체 화면 전환' : '스마트폰 프레임 전환';
                }
            }
        });

        this.btnUnlockLevel20?.addEventListener('click', () => {
            if (this.callbacks.onUnlockLevel20) this.callbacks.onUnlockLevel20();
        });

        this.btnFastForwardDay?.addEventListener('click', () => {
            if (this.callbacks.onNextDay) this.callbacks.onNextDay();
        });

        this.btnTriggerSettlement?.addEventListener('click', () => {
            if (this.callbacks.onTriggerSettlement) this.callbacks.onTriggerSettlement();
        });

        this.btnResetDemo?.addEventListener('click', () => {
            if (this.callbacks.onReset) this.callbacks.onReset();
        });
    }

    updateState(state) {
        if (this.txtUnlockToggle) {
            this.txtUnlockToggle.textContent = state.isLevel20Unlocked
                ? '🔒 레벨 20 잠금 활성화'
                : '🔓 공매도/레버리지 해금 (Lv.20)';
        }
        if (this.btnUnlockLevel20) {
            if (state.isLevel20Unlocked) {
                this.btnUnlockLevel20.classList.add('active-unlocked');
            } else {
                this.btnUnlockLevel20.classList.remove('active-unlocked');
            }
        }
    }

    show() {
        this.element?.classList.remove('hidden');
    }

    hide() {
        this.element?.classList.add('hidden');
    }

    isVisible() {
        return this.element && !this.element.classList.contains('hidden');
    }
}
