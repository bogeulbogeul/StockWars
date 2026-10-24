/**
 * CharacterCreation Component (트레이더 자격 등록 & 주민 등록 키오스크)
 * Unity equivalent: UICharacterCreation.cs / CharacterCreationSystem.cs
 * Modular architecture:
 * - PersonalityTestStep: Step 2 TPT investment diagnostics
 * - TraderIDCardStep: Step 3 Hologram pass ceremony
 */

import { updateCharacterSprite } from './CharacterSprite.js';
import { PersonalityTestStep } from './character/PersonalityTestStep.js';
import { TraderIDCardStep } from './character/TraderIDCardStep.js';
import { registerNickname } from '../engine/NicknameRegistration.js';

export class CharacterCreation {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks || {};

        // Legacy profile fields retained for save compatibility
        this.shape = 'square';
        this.styleId = 'dog';
        this.gender = 'male';
        this.skinTone = 'fair';
        this.hairStyle = 'short';
        this.direction = 'front';
        this.nickname = '사이퍼 트레이더';

        this.directions = ['front', 'right', 'back', 'left'];
        this.currentStep = 1;
        this.chosenTrait = null;

        this.render();
        this.initDOM();
        this.initSubComponents();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="characterCreationModal" class="char-create-overlay hidden">
                <div class="char-create-kiosk">
                    <div class="kiosk-header">
                        <h2 class="kiosk-title">주민 등록</h2>
                    </div>

                    <!-- STEP 1: NICKNAME REGISTRATION -->
                    <div class="char-step-view active" id="charStep1">
                        <div class="char-creator-grid">
                            <div class="avatar-preview-box">
                                <div class="avatar-stage">
                                    <div class="avatar-halo"></div>
                                    <div class="avatar-figure" id="avatarFigure"></div>
                                    <div class="avatar-shadow"></div>
                                </div>
                                <div class="avatar-nav-row">
                                    <button type="button" class="avatar-rotate-btn" id="btnRotLeft" title="왼쪽으로 회전" aria-label="캐릭터 왼쪽으로 회전">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 L9 12 L14.5 17.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                    <button type="button" class="avatar-rotate-btn" id="btnRotRight" title="오른쪽으로 회전" aria-label="캐릭터 오른쪽으로 회전">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6.5 L15 12 L9.5 17.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                </div>
                            </div>

                            <div class="custom-controls-box">
                                <div class="control-group">
                                    <label class="control-label">트레이더 닉네임 · 최대 10글자</label>
                                    <div class="nickname-input-group">
                                        <input type="text" id="inputNickname" value="사이퍼 트레이더" maxlength="10" placeholder="닉네임 입력 (최대 10글자)">
                                        <button class="random-btn" id="btnRandomNick" title="랜덤 닉네임 생성">🎲</button>
                                    </div>
                                </div>

                                <div class="custom-actions-row">
                                    <button class="kiosk-action-btn primary" id="btnStep1Next">
                                        <span>투자 성향 진단 테스트 ➔</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 2: PERSONALITY TEST -->
                    <div class="char-step-view hidden" id="charStep2">
                        <div class="test-container">
                            <div class="test-progress-bar">
                                <div class="test-progress-fill" id="testProgressFill" style="width: 33.3%;"></div>
                            </div>
                            <div class="test-question-box">
                                <div style="display: flex; justify-content: flex-end; align-items: center;">
                                    <span class="test-step-count" id="testStepCount">문항 1 / 3</span>
                                </div>
                                <h3 class="test-q-title" id="testQTitle">Q1. 산 주식이 갑자기 떨어졌다면?</h3>
                                <div class="test-options-list" id="testOptionsList"></div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 3: ID CARD CEREMONY -->
                    <div class="char-step-view hidden" id="charStep3">
                        <div class="id-ceremony-container">
                            <div class="hologram-id-card">
                                <div class="id-card-top">
                                    <div class="id-card-logo">
                                        <span class="id-emblem">🏛️</span>
                                        <div class="id-corp-text">
                                            <span class="id-corp-main">CIPHER SECURITIES</span>
                                            <span class="id-corp-sub">OFFICIAL TRADER PASS</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="id-card-body">
                                    <div class="id-photo-frame">
                                        <div class="id-photo-inner" id="idCardPhoto"></div>
                                    </div>
                                    <div class="id-info-details">
                                        <div class="id-row">
                                            <span class="id-lbl">트레이더 명</span>
                                            <span class="id-val highlight" id="idCardName">사이퍼 트레이더</span>
                                        </div>
                                        <div class="id-row">
                                            <span class="id-lbl">투자 성향</span>
                                            <span class="id-trait-tag" id="idCardTrait">📊 예리한 분석가</span>
                                        </div>
                                        <div class="id-bonus-box">
                                            <span class="bonus-lbl">성향 고유 보너스</span>
                                            <span class="bonus-val" id="idCardBonusVal">분석력 +1 • 찌라시 해독률 강화</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="id-card-footer">
                                    <div class="id-barcode"></div>
                                    <span class="id-reg-num" id="idCardRegNum">CIPHER-TRD-2026-9901</span>
                                </div>
                            </div>

                            <button class="kiosk-action-btn complete-btn" id="btnFinishCreation">
                                <span>🏢 오피스 입장 및 거래 시작하기 ➔</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.modal = document.getElementById('characterCreationModal');
        this.charStep1 = document.getElementById('charStep1');
        this.charStep2 = document.getElementById('charStep2');
        this.charStep3 = document.getElementById('charStep3');
        this.avatarFigure = document.getElementById('avatarFigure');
        this.btnRotLeft = document.getElementById('btnRotLeft');
        this.btnRotRight = document.getElementById('btnRotRight');
        this.inputNickname = document.getElementById('inputNickname');
        this.btnRandomNick = document.getElementById('btnRandomNick');
        this.btnStep1Next = document.getElementById('btnStep1Next');
        this.btnFinishCreation = document.getElementById('btnFinishCreation');
    }

    initSubComponents() {
        this.personalityStep = new PersonalityTestStep({
            testProgressFill: document.getElementById('testProgressFill'),
            testStepCount: document.getElementById('testStepCount'),
            testQTitle: document.getElementById('testQTitle'),
            testOptionsList: document.getElementById('testOptionsList')
        }, {
            onEvaluated: (chosenTrait) => {
                this.chosenTrait = chosenTrait;
                this.showIdCardCeremony();
            }
        });

        this.idCardStep = new TraderIDCardStep({
            idCardPhoto: document.getElementById('idCardPhoto'),
            idCardName: document.getElementById('idCardName'),
            idCardTrait: document.getElementById('idCardTrait'),
            idCardBonusVal: document.getElementById('idCardBonusVal'),
            idCardRegNum: document.getElementById('idCardRegNum'),
        });
    }

    initEventListeners() {
        this.btnRotLeft?.addEventListener('click', () => {
            const idx = this.directions.indexOf(this.direction);
            this.direction = this.directions[(idx - 1 + this.directions.length) % this.directions.length];
            this.updateAvatarPreview();
        });

        this.btnRotRight?.addEventListener('click', () => {
            const idx = this.directions.indexOf(this.direction);
            this.direction = this.directions[(idx + 1) % this.directions.length];
            this.updateAvatarPreview();
        });

        this.btnRandomNick?.addEventListener('click', () => {
            const prefixes = ['불사조', '여의도', '새벽의', '천재', '황금', '다이아', '사이버', '질주하는'];
            const names = ['개미', '고래', '트레이더', '승부사', '늑대', '워렌', '퀀트'];
            const nick = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
            if (this.inputNickname) {
                this.inputNickname.value = nick;
                this.nickname = nick;
            }
        });

        this.inputNickname?.addEventListener('input', (e) => {
            this.nickname = e.target.value.trim() || '사이퍼 트레이더';
        });

        this.btnStep1Next?.addEventListener('click', async () => {
            if (this.btnStep1Next.disabled) return;
            this.btnStep1Next.disabled = true;
            let error = this.modal.querySelector('.nickname-validation-error');
            if (!error) {
                error = document.createElement('p');
                error.className = 'nickname-validation-error';
                error.setAttribute('role', 'alert');
                error.style.cssText = 'color:#ff9eae;font-size:13px;margin:10px 0;';
                this.inputNickname.parentElement.append(error);
            }
            try {
                const { nickname, pending } = await registerNickname(this.inputNickname.value, window.stockWarsPresence);
                this.nicknamePending = pending;
                this.nickname = nickname;
                this.inputNickname.value = nickname;
                error.textContent = '';
                this.setStep(2);
                this.personalityStep.reset();
            } catch (failure) {
                error.textContent = failure.message;
                this.inputNickname.focus();
            } finally { this.btnStep1Next.disabled = false; }
        });

        this.btnFinishCreation?.addEventListener('click', () => {
            this.finishCreation();
        });
    }

    setStep(step) {
        this.currentStep = step;
        const titles = { 1: '주민 등록', 2: '투자 성향 진단', 3: '트레이더 자격증' };
        this.modal.querySelector('.kiosk-title').textContent = titles[step];
        this.charStep1?.classList.toggle('active', step === 1);
        this.charStep1?.classList.toggle('hidden', step !== 1);
        this.charStep2?.classList.toggle('active', step === 2);
        this.charStep2?.classList.toggle('hidden', step !== 2);
        this.charStep3?.classList.toggle('active', step === 3);
        this.charStep3?.classList.toggle('hidden', step !== 3);
    }

    updateAvatarPreview() {
        if (this.avatarFigure) {
            updateCharacterSprite(this.avatarFigure, { styleId: this.styleId, direction: this.direction });
            // Selection camera zoom; world character height remains90.
            this.avatarFigure.style.transform = 'scale(2)';
            this.avatarFigure.style.transformOrigin = 'center';
        }

    }

    showIdCardCeremony() {
        this.setStep(3);
        if (!this.traderCode) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let seg1 = '', seg2 = '';
            for (let i = 0; i < 4; i++) seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
            for (let i = 0; i < 4; i++) seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
            this.traderCode = `CIPHER-TRD-${seg1}-${seg2}`;
        }
        this.idCardStep.renderCeremony({
            nickname: this.nickname,
            styleId: this.styleId,
            shape: this.shape,
            skinTone: this.skinTone,
            hairStyle: this.hairStyle,
            traderCode: this.traderCode
        }, this.chosenTrait);
    }

    open(initialMode = 'NEW') {
        this.initialMode = 'NEW';
        this.traderCode = null;
        this.setStep(1);
        this.updateAvatarPreview();
        this.modal?.classList.remove('hidden');
    }

    close() {
        this.modal?.classList.add('hidden');
    }

    finishCreation() {
        const userProfile = {
            nickname: this.nickname,
            styleId: this.styleId,
            shape: this.shape,
            gender: this.gender,
            nicknamePending: this.nicknamePending === true,
            skinTone: this.skinTone,
            hairStyle: this.hairStyle,
            trait: this.chosenTrait,
            traderCode: this.traderCode,
            mode: this.initialMode || 'NEW'
        };

        this.close();
        if (this.callbacks && this.callbacks.onComplete) {
            this.callbacks.onComplete(userProfile);
        }
    }
}
