/**
 * CharacterCreation Component (트레이더 자격 등록 & 아바타 설정 키오스크)
 * Unity equivalent: UICharacterCreation.cs / CharacterCreationSystem.cs
 * Modular architecture:
 * - PersonalityTestStep: Step 2 TPT investment diagnostics
 * - TraderIDCardStep: Step 3 Hologram pass ceremony
 */

import { createGeometricAvatarSVG } from './GeometricAvatar.js';
import { PersonalityTestStep } from './character/PersonalityTestStep.js';
import { TraderIDCardStep } from './character/TraderIDCardStep.js';

export class CharacterCreation {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks || {};

        // Customization State
        this.shape = 'square';
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
                        <div class="kiosk-badge">CIPHER SECURITIES • KIOSK</div>
                        <h2 class="kiosk-title">트레이더 자격 등록 & 아바타 설정</h2>
                        <button class="kiosk-close-btn" id="btnCharCreateClose" title="닫기">✕</button>
                    </div>

                    <div class="kiosk-stepper">
                        <div class="step-item active" id="stepIndicator1">
                            <span class="step-num">1</span>
                            <span class="step-label">기본 캐릭터 설정</span>
                        </div>
                        <div class="step-line" id="stepLine1"></div>
                        <div class="step-item" id="stepIndicator2">
                            <span class="step-num">2</span>
                            <span class="step-label">투자 성향 진단</span>
                        </div>
                        <div class="step-line" id="stepLine2"></div>
                        <div class="step-item" id="stepIndicator3">
                            <span class="step-num">3</span>
                            <span class="step-label">출입증 발급</span>
                        </div>
                    </div>

                    <!-- STEP 1: AVATAR CUSTOMIZATION -->
                    <div class="char-step-view active" id="charStep1">
                        <div class="char-creator-grid">
                            <div class="avatar-preview-box">
                                <div class="avatar-stage">
                                    <div class="avatar-halo"></div>
                                    <div class="avatar-figure" id="avatarFigure"></div>
                                    <div class="avatar-shadow"></div>
                                </div>
                                <div class="avatar-nav-row">
                                    <button class="stardew-arrow-btn left" id="btnRotLeft" title="왼쪽으로 회전">
                                        <svg viewBox="0 0 16 16"><path d="M10 2 L4 8 L10 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
                                    </button>
                                    <button class="stardew-arrow-btn right" id="btnRotRight" title="오른쪽으로 회전">
                                        <svg viewBox="0 0 16 16"><path d="M6 2 L12 8 L6 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
                                    </button>
                                </div>
                            </div>

                            <div class="custom-controls-box">
                                <div class="control-group">
                                    <label class="control-label">트레이더 닉네임</label>
                                    <div class="nickname-input-group">
                                        <input type="text" id="inputNickname" value="사이퍼 트레이더" maxlength="12" placeholder="닉네임 입력...">
                                        <button class="random-btn" id="btnRandomNick" title="랜덤 닉네임 생성">🎲</button>
                                    </div>
                                </div>

                                <div class="control-group" id="shapeControlGroup">
                                    <label class="control-label">캐릭터 형태</label>
                                    <div class="shape-swatch-group">
                                        <button class="shape-swatch-btn active" data-shape="square" title="기본 하얀색 네모">
                                            <span class="shape-icon">⬜</span>
                                            <span>기본 하얀색 네모</span>
                                        </button>
                                    </div>
                                    <div class="character-guide-note" style="margin-top: 8px; font-size: 11.5px; color: var(--accent-cyan); background: rgba(0,229,255,0.08); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,229,255,0.2);">
                                        🏢 홈 오피스 입장 후 바닥 타일 클릭 또는 방향키(WASD)로 자유롭게 캐릭터를 이동시켜 움직임을 테스트할 수 있습니다.
                                    </div>
                                </div>

                                <div class="custom-actions-row">
                                    <button class="kiosk-action-btn primary" id="btnStep1Next">
                                        <span>다음: 투자 성향 진단 테스트 ➔</span>
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
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span class="kiosk-badge">TRADER PERSONALITY TEST (TPT)</span>
                                    <span class="test-step-count" id="testStepCount">문항 1 / 3</span>
                                </div>
                                <h3 class="test-q-title" id="testQTitle">Q1. 시장 대폭락 상황, 당신의 첫 행동은?</h3>
                                <div class="test-options-list" id="testOptionsList"></div>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 3: ID CARD CEREMONY -->
                    <div class="char-step-view hidden" id="charStep3">
                        <div class="id-ceremony-container">
                            <div class="ceremony-anna-bubble">
                                <div class="anna-mini-avatar">👩‍💼</div>
                                <div class="anna-speech-txt" id="ceremonyAnnaSpeech">
                                    "축하합니다! 사이퍼 증권 트레이더 출입증 발급이 완료되었습니다."
                                </div>
                            </div>

                            <div class="hologram-id-card">
                                <div class="id-card-top">
                                    <div class="id-card-logo">
                                        <span class="id-emblem">🏛️</span>
                                        <div class="id-corp-text">
                                            <span class="id-corp-main">CIPHER SECURITIES</span>
                                            <span class="id-corp-sub">OFFICIAL TRADER PASS</span>
                                        </div>
                                    </div>
                                    <div class="id-chip"></div>
                                </div>

                                <div class="id-card-body">
                                    <div class="id-photo-frame">
                                        <div class="id-photo-inner" id="idCardPhoto"></div>
                                        <span class="id-certified-stamp">CERTIFIED</span>
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
        this.btnClose = document.getElementById('btnCharCreateClose');
        this.stepIndicator1 = document.getElementById('stepIndicator1');
        this.stepIndicator2 = document.getElementById('stepIndicator2');
        this.stepIndicator3 = document.getElementById('stepIndicator3');
        this.stepLine1 = document.getElementById('stepLine1');
        this.stepLine2 = document.getElementById('stepLine2');
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
            ceremonyAnnaSpeech: document.getElementById('ceremonyAnnaSpeech')
        });
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());

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

        this.btnStep1Next?.addEventListener('click', () => {
            this.setStep(2);
            this.personalityStep.reset();
        });

        this.btnFinishCreation?.addEventListener('click', () => {
            this.finishCreation();
        });
    }

    setStep(step) {
        this.currentStep = step;
        this.charStep1?.classList.toggle('active', step === 1);
        this.charStep1?.classList.toggle('hidden', step !== 1);
        this.charStep2?.classList.toggle('active', step === 2);
        this.charStep2?.classList.toggle('hidden', step !== 2);
        this.charStep3?.classList.toggle('active', step === 3);
        this.charStep3?.classList.toggle('hidden', step !== 3);

        this.stepIndicator1?.classList.toggle('active', step >= 1);
        this.stepIndicator2?.classList.toggle('active', step >= 2);
        this.stepIndicator3?.classList.toggle('active', step >= 3);
        this.stepLine1?.classList.toggle('active', step >= 2);
        this.stepLine2?.classList.toggle('active', step >= 3);
    }

    updateAvatarPreview() {
        if (this.avatarFigure) {
            this.avatarFigure.innerHTML = createGeometricAvatarSVG({
                shape: this.shape,
                skinTone: this.skinTone,
                hairStyle: this.hairStyle,
                direction: this.direction
            });
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
            shape: this.shape,
            skinTone: this.skinTone,
            hairStyle: this.hairStyle,
            traderCode: this.traderCode
        }, this.chosenTrait);
    }

    open(initialMode = 'NEW') {
        this.initialMode = initialMode;
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
            shape: this.shape,
            gender: this.gender,
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