/**
 * CharacterCreation Component
 * Unity equivalent: UICharacterCreation.cs / CharacterCreationSystem.cs
 * Implements GDD CORE_GDD_08:
 * Step 1: Base Character Customization (Gender, 4-Direction Rotation, Nickname)
 * Step 2: Trader Personality Test (TPT - 3 Diagnostic Questions)
 * Step 3: Trader ID Card Ceremony (Cipher Securities Official Holographic Pass)
 */

import { createGeometricAvatarSVG } from './GeometricAvatar.js';

export class CharacterCreation {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;

        // Customization State
        this.shape = 'square'; // 'square' (기본 하얀색 네모)
        this.gender = 'male';
        this.skinTone = 'fair';
        this.hairStyle = 'short';
        this.direction = 'front'; // 'front' | 'right' | 'back' | 'left'
        this.nickname = '사이퍼 트레이더';
        this.motion = 'idle';
        this.debugBones = false;
        this.skeletonRenderer = null;

        this.directions = ['front', 'right', 'back', 'left'];

        // Personality Test State
        this.currentStep = 1; // 1: Avatar, 2: Test, 3: ID Card
        this.currentQuestionIdx = 0;
        this.personalityScores = {
            analysis: 0,    // 분석력 (예리한 분석가)
            negotiation: 0, // 협상력 (베테랑 협상가)
            management: 0,  // 운용력 (공격적 자산가)
            recovery: 0     // 회복력 (불굴의 트레이더)
        };
        this.chosenTrait = null;

        this.questions = [
            {
                q: "Q1. 시장 대폭락 상황, 당신의 첫 행동은?",
                options: [
                    { key: 'analysis', label: "A. 차트의 기술적 지표를 정밀 분석한다.", stat: "분석력" },
                    { key: 'negotiation', label: "B. 금융권 지인에게 연락해 대출 한도를 체크한다.", stat: "협상력" },
                    { key: 'management', label: "C. 저점 매수 기회로 보고 남은 자산을 투입한다.", stat: "운용력" },
                    { key: 'recovery', label: "D. 일단 휴식을 취하며 시장의 평정심을 기다린다.", stat: "회복력" }
                ]
            },
            {
                q: "Q2. 당신이 가장 신뢰하는 정보의 원천은?",
                options: [
                    { key: 'analysis', label: "A. 수치와 데이터가 증명된 공식 리포트", stat: "분석력" },
                    { key: 'negotiation', label: "B. 업계 핵심 관계자로부터 들은 은밀한 찌라시", stat: "협상력" },
                    { key: 'management', label: "C. 시장의 전체적인 거래량과 유동성 흐름", stat: "운용력" },
                    { key: 'recovery', label: "D. 직접 발로 뛰며 체감한 시장의 분위기", stat: "회복력" }
                ]
            },
            {
                q: "Q3. 큰 수익을 낸 후 가장 먼저 하고 싶은 일은?",
                options: [
                    { key: 'analysis', label: "A. 매매 일지를 작성하며 승리 요인을 복기한다.", stat: "분석력" },
                    { key: 'negotiation', label: "B. 더 좋은 고급 정보를 얻기 위해 업계 지인들과 식사한다.", stat: "협상력" },
                    { key: 'management', label: "C. 수익금으로 오피스를 확장하거나 고급 가구를 산다.", stat: "운용력" },
                    { key: 'recovery', label: "D. 스파나 여행을 통해 쌓인 스트레스를 해소한다.", stat: "회복력" }
                ]
            }
        ];

        this.traitsData = {
            analysis: {
                title: "예리한 분석가",
                statName: "분석력 +1",
                statColor: "#00e5ff",
                icon: "📊",
                bonusDesc: "찌라시 해독률 보너스 및 노이즈 필터링 강화",
                effect: "정보 신뢰도 판별 성공률 +20%"
            },
            negotiation: {
                title: "베테랑 협상가",
                statName: "협상력 +1",
                statColor: "#ffd600",
                icon: "🤝",
                bonusDesc: "대출 이율 감면 및 매매 수수료 할인",
                effect: "거래 수수료 -30% & 대출 이자 감면"
            },
            management: {
                title: "공격적 자산가",
                statName: "운용력 +1",
                statColor: "#ff4081",
                icon: "💰",
                bonusDesc: "보유 가능 종목 수 및 매수 한도 증대",
                effect: "포트폴리오 종목 슬롯 +2개"
            },
            recovery: {
                title: "불굴의 트레이더",
                statName: "회복력 +1",
                statColor: "#00e676",
                icon: "⚡",
                bonusDesc: "스테미너 회복 속도 보너스 및 알바 보상 상향",
                effect: "당일 피로도 회복 속도 2배"
            }
        };

        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="characterCreationModal" class="char-create-overlay hidden">
                <div class="char-create-kiosk">
                    <!-- Top Title Bar -->
                    <div class="kiosk-header">
                        <div class="kiosk-badge">CIPHER SECURITIES • KIOSK</div>
                        <h2 class="kiosk-title">트레이더 자격 등록 & 아바타 설정</h2>
                        <button class="kiosk-close-btn" id="btnCharCreateClose" title="닫기">✕</button>
                    </div>

                    <!-- Step Stepper Indicators -->
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
                            <!-- Left: Live Full-Body Avatar Preview Canvas -->
                            <div class="avatar-preview-box">
                                <div class="avatar-stage">
                                    <div class="avatar-halo"></div>
                                    <div class="avatar-figure" id="avatarFigure">
                                        <!-- Full-Body Dynamic Avatar Rendered via 2D Sprite PNGs -->
                                    </div>
                                    <div class="avatar-shadow"></div>
                                </div>
                                <!-- Stardew Valley Style Arrow Navigation -->
                                <div class="avatar-nav-row">
                                    <button class="stardew-arrow-btn left" id="btnRotLeft" title="왼쪽으로 회전">
                                        <svg viewBox="0 0 16 16"><path d="M10 2 L4 8 L10 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
                                    </button>
                                    <button class="stardew-arrow-btn right" id="btnRotRight" title="오른쪽으로 회전">
                                        <svg viewBox="0 0 16 16"><path d="M6 2 L12 8 L6 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>
                                    </button>
                                </div>
                            </div>

                            <!-- Right: Customization Controls -->
                            <div class="custom-controls-box">
                                <!-- Nickname Input -->
                                <div class="control-group">
                                    <label class="control-label">트레이더 닉네임</label>
                                    <div class="nickname-input-group">
                                        <input type="text" id="inputNickname" value="사이퍼 트레이더" maxlength="12" placeholder="닉네임 입력...">
                                        <button class="random-btn" id="btnRandomNick" title="랜덤 닉네임 생성">🎲</button>
                                    </div>
                                </div>

                                <!-- Character Type Display -->
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

                                <!-- Animation Motion Selection (2D Skeletal Engine - Demo Only) -->
                                <div class="control-group demo-only-control" id="motionControlGroup">
                                    <div class="bone-debug-row">
                                        <label class="control-label">
                                            캐릭터 모션 (Animation)
                                            <span class="demo-badge-pill">DEMO 전용</span>
                                        </label>
                                        <button class="bone-toggle-btn" id="btnToggleBones" title="2D 뼈대 와이어프레임 보기">
                                            <span>🦴 뼈대 보기</span>
                                        </button>
                                    </div>
                                    <div class="motion-swatch-group">
                                        <button class="motion-btn active" data-motion="idle" title="대기 모션 (호흡 & 바운스)">
                                            <span class="motion-icon">🧘</span>
                                            <span>대기</span>
                                        </button>
                                        <button class="motion-btn" data-motion="walk" title="보행 모션 (4방향 걷기)">
                                            <span class="motion-icon">🚶</span>
                                            <span>걷기</span>
                                        </button>
                                        <button class="motion-btn" data-motion="trade_win" title="수익 환호 점프 모션">
                                            <span class="motion-icon">🎉</span>
                                            <span>환호</span>
                                        </button>
                                        <button class="motion-btn" data-motion="trade_loss" title="손절/폭락 멘붕 모션">
                                            <span class="motion-icon">📉</span>
                                            <span>좌절</span>
                                        </button>
                                        <button class="motion-btn" data-motion="typing" title="HTS 트레이딩 모션">
                                            <span class="motion-icon">⌨️</span>
                                            <span>매매</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Info Banner for Customization Expansion (Demo Only) -->
                                <div class="custom-info-card demo-only-control" id="demoMotionInfoCard">
                                    <div class="info-icon">✨</div>
                                    <div class="info-content">
                                        <div class="info-title">스켈레탈 본(Bone) 아바타 시스템 (데모 프리뷰)</div>
                                        <div class="info-desc">라인 플레이 및 메이플스토리 방식의 2D 관절 뼈대 시스템이 적용되었습니다. 걷기/환호/매매 모션 및 4방향 회전이 실시간 60FPS로 구동됩니다.</div>
                                    </div>
                                </div>

                                <button class="kiosk-action-btn primary" id="btnGoToStep2">
                                    다음: 투자 성향 진단 테스트 (TPT) ➔
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 2: PERSONALITY TEST (TPT) -->
                    <div class="char-step-view hidden" id="charStep2">
                        <div class="test-container">
                            <div class="test-progress-bar">
                                <div class="test-progress-fill" id="testProgressFill" style="width: 33%;"></div>
                            </div>
                            <div class="test-step-count" id="testStepCount">문항 1 / 3</div>

                            <div class="test-question-box">
                                <h3 class="test-q-title" id="testQTitle">Q1. 시장 대폭락 상황, 당신의 첫 행동은?</h3>
                                <div class="test-options-list" id="testOptionsList">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>

                            <div class="test-nav-actions">
                                <button class="kiosk-back-btn" id="btnBackToStep1">◀ 캐릭터 재설정</button>
                            </div>
                        </div>
                    </div>

                    <!-- STEP 3: ID CARD CEREMONY -->
                    <div class="char-step-view hidden" id="charStep3">
                        <div class="id-ceremony-container">
                            <!-- Anna Speech Bubble -->
                            <div class="ceremony-anna-bubble">
                                <div class="anna-mini-avatar">👩‍💼</div>
                                <div class="anna-speech-txt" id="ceremonyAnnaSpeech">
                                    "축하합니다! 사이퍼 증권 공인 트레이더 자격 등록이 완료되었습니다. 발급된 출입증을 확인하시고 오피스로 입장하세요."
                                </div>
                            </div>

                            <!-- Holographic Official Trader ID Card -->
                            <div class="hologram-id-card" id="hologramIdCard">
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
                                    <!-- ID Photo -->
                                    <div class="id-photo-frame">
                                        <div class="id-photo-inner" id="idCardPhoto">
                                            <!-- Rendered avatar sprite -->
                                        </div>
                                        <div class="id-certified-stamp">CERTIFIED</div>
                                    </div>

                                    <!-- ID Info Details -->
                                    <div class="id-info-details">
                                        <div class="id-row">
                                            <span class="id-lbl">NAME</span>
                                            <span class="id-val highlight" id="idCardName">사이퍼 트레이더</span>
                                        </div>
                                        <div class="id-row">
                                            <span class="id-lbl">CLASS</span>
                                            <span class="id-val">CLASS-D TRADER</span>
                                        </div>
                                        <div class="id-row">
                                            <span class="id-lbl">TRAIT</span>
                                            <span class="id-trait-tag" id="idCardTrait">예리한 분석가</span>
                                        </div>
                                        <div class="id-bonus-box" id="idCardBonusBox">
                                            <span class="bonus-lbl">초기 특성 보너스:</span>
                                            <span class="bonus-val" id="idCardBonusVal">찌라시 해독률 보너스</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="id-card-footer">
                                    <div class="id-barcode"></div>
                                    <div class="id-reg-num" id="idCardRegNum">CIPHER-TRD-202609</div>
                                </div>
                            </div>

                            <!-- Enter Office Button -->
                            <button class="kiosk-action-btn complete-btn" id="btnCompleteAndEnter">
                                🚀 오피스 입장 및 거래 시작하기
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

        // Stepper
        this.stepIndicator1 = document.getElementById('stepIndicator1');
        this.stepIndicator2 = document.getElementById('stepIndicator2');
        this.stepIndicator3 = document.getElementById('stepIndicator3');
        this.stepLine1 = document.getElementById('stepLine1');
        this.stepLine2 = document.getElementById('stepLine2');

        // Step views
        this.charStep1 = document.getElementById('charStep1');
        this.charStep2 = document.getElementById('charStep2');
        this.charStep3 = document.getElementById('charStep3');

        // Step 1 DOM
        this.avatarFigure = document.getElementById('avatarFigure');
        this.previewNickBadge = document.getElementById('previewNickBadge');
        this.inputNickname = document.getElementById('inputNickname');
        this.btnRandomNick = document.getElementById('btnRandomNick');
        this.btnGoToStep2 = document.getElementById('btnGoToStep2');
        this.motionControlGroup = document.getElementById('motionControlGroup');
        this.demoMotionInfoCard = document.getElementById('demoMotionInfoCard');
        this.btnToggleBones = document.getElementById('btnToggleBones');

        // 4-Direction Rotation DOM
        this.btnRotLeft = document.getElementById('btnRotLeft');
        this.btnRotRight = document.getElementById('btnRotRight');

        // Step 2 DOM
        this.testProgressFill = document.getElementById('testProgressFill');
        this.testStepCount = document.getElementById('testStepCount');
        this.testQTitle = document.getElementById('testQTitle');
        this.testOptionsList = document.getElementById('testOptionsList');
        this.btnBackToStep1 = document.getElementById('btnBackToStep1');

        // Step 3 DOM
        this.ceremonyAnnaSpeech = document.getElementById('ceremonyAnnaSpeech');
        this.idCardPhoto = document.getElementById('idCardPhoto');
        this.idCardName = document.getElementById('idCardName');
        this.idCardTrait = document.getElementById('idCardTrait');
        this.idCardBonusVal = document.getElementById('idCardBonusVal');
        this.idCardRegNum = document.getElementById('idCardRegNum');
        this.btnCompleteAndEnter = document.getElementById('btnCompleteAndEnter');

        this.updateAvatarPreview();
    }

    initEventListeners() {
        this.btnClose?.addEventListener('click', () => this.close());

        // Step 1: Nickname Input
        this.inputNickname?.addEventListener('input', (e) => {
            this.nickname = e.target.value.trim() || '사이퍼 트레이더';
            if (this.previewNickBadge) this.previewNickBadge.textContent = this.nickname;
        });

        // Random Nickname
        this.btnRandomNick?.addEventListener('click', () => {
            const prefixes = ['불사조', '골든', '월가', '슈퍼', '로켓', '퀀트', '다이아', '불꽃', '차트', '나스닥'];
            const names = ['황소', '워렌', '트레이더', '빅쇼트', '독수리', '버핏', '마스터', '고수', '헌터', '웨이브'];
            const p = prefixes[Math.floor(Math.random() * prefixes.length)];
            const n = names[Math.floor(Math.random() * names.length)];
            this.nickname = `${p} ${n}`;
            if (this.inputNickname) this.inputNickname.value = this.nickname;
            if (this.previewNickBadge) this.previewNickBadge.textContent = this.nickname;
        });

        // Shape Swatches (Circle vs Square)
        document.querySelectorAll('.shape-swatch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-swatch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.shape = btn.dataset.shape;
                this.updateAvatarPreview();
            });
        });

        // Skin Tone Swatches
        document.querySelectorAll('.skin-swatch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.skin-swatch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.skinTone = btn.dataset.skin;
                this.updateAvatarPreview();
            });
        });

        // Hair Style Swatches
        document.querySelectorAll('.hair-swatch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hair-swatch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.hairStyle = btn.dataset.hair;
                this.updateAvatarPreview();
            });
        });

        // Motion Selection Swatches (2D Skeletal Animation)
        document.querySelectorAll('.motion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.motion-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.motion = btn.dataset.motion;
                if (this.skeletonRenderer) {
                    this.skeletonRenderer.playAnimation(this.motion);
                }
            });
        });

        // 2D Bone Rig Wireframe Debug Toggle
        const btnToggleBones = document.getElementById('btnToggleBones');
        btnToggleBones?.addEventListener('click', () => {
            this.debugBones = !this.debugBones;
            btnToggleBones.classList.toggle('active', this.debugBones);
            if (this.skeletonRenderer) {
                this.skeletonRenderer.toggleDebugBones(this.debugBones);
            }
        });

        // Rotation Controls: Turn Left (↺)
        this.btnRotLeft?.addEventListener('click', () => {
            const currentIdx = this.directions.indexOf(this.direction);
            const nextIdx = (currentIdx - 1 + this.directions.length) % this.directions.length;
            this.setDirection(this.directions[nextIdx]);
        });

        // Rotation Controls: Turn Right (↻)
        this.btnRotRight?.addEventListener('click', () => {
            const currentIdx = this.directions.indexOf(this.direction);
            const nextIdx = (currentIdx + 1) % this.directions.length;
            this.setDirection(this.directions[nextIdx]);
        });

        // Go to Step 2
        this.btnGoToStep2?.addEventListener('click', () => {
            this.setStep(2);
            this.currentQuestionIdx = 0;
            this.personalityScores = { analysis: 0, negotiation: 0, management: 0, recovery: 0 };
            this.renderQuestion();
        });

        // Back to Step 1
        this.btnBackToStep1?.addEventListener('click', () => {
            this.setStep(1);
        });

        // Step 3: Complete and Enter Office
        this.btnCompleteAndEnter?.addEventListener('click', () => {
            this.finishCreation();
        });
    }

    setDirection(dir) {
        this.direction = dir;
        this.updateAvatarPreview();
    }

    setStep(step) {
        this.currentStep = step;

        // Update Step Views
        this.charStep1?.classList.toggle('active', step === 1);
        this.charStep1?.classList.toggle('hidden', step !== 1);

        this.charStep2?.classList.toggle('active', step === 2);
        this.charStep2?.classList.toggle('hidden', step !== 2);

        this.charStep3?.classList.toggle('active', step === 3);
        this.charStep3?.classList.toggle('hidden', step !== 3);

        // Update Stepper Line & Items
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

    renderQuestion() {
        const qData = this.questions[this.currentQuestionIdx];
        if (!qData) return;

        const progressPct = ((this.currentQuestionIdx + 1) / this.questions.length) * 100;
        if (this.testProgressFill) this.testProgressFill.style.width = `${progressPct}%`;
        if (this.testStepCount) this.testStepCount.textContent = `문항 ${this.currentQuestionIdx + 1} / ${this.questions.length}`;
        if (this.testQTitle) this.testQTitle.textContent = qData.q;

        if (this.testOptionsList) {
            this.testOptionsList.innerHTML = qData.options.map((opt) => `
                <button class="test-opt-btn" data-key="${opt.key}">
                    <span class="opt-text">${opt.label}</span>
                </button>
            `).join('');

            this.testOptionsList.querySelectorAll('.test-opt-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    this.personalityScores[key] = (this.personalityScores[key] || 0) + 1;
                    btn.classList.add('selected');

                    setTimeout(() => {
                        this.currentQuestionIdx += 1;
                        if (this.currentQuestionIdx < this.questions.length) {
                            this.renderQuestion();
                        } else {
                            this.evaluatePersonality();
                        }
                    }, 220);
                });
            });
        }
    }

    evaluatePersonality() {
        let bestKey = 'analysis';
        let maxScore = -1;

        for (const [k, score] of Object.entries(this.personalityScores)) {
            if (score > maxScore) {
                maxScore = score;
                bestKey = k;
            }
        }

        this.chosenTrait = this.traitsData[bestKey];
        this.showIdCardCeremony();
    }

    showIdCardCeremony() {
        this.setStep(3);

        if (this.idCardPhoto) {
            this.idCardPhoto.innerHTML = `
                <div class="id-photo-geometric-wrapper" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 4px;">
                    ${createGeometricAvatarSVG({
                        shape: this.shape,
                        skinTone: this.skinTone,
                        hairStyle: this.hairStyle,
                        direction: 'front'
                    })}
                </div>
            `;
        }

        if (this.idCardName) this.idCardName.textContent = this.nickname;

        if (this.idCardTrait && this.chosenTrait) {
            this.idCardTrait.textContent = `${this.chosenTrait.icon} ${this.chosenTrait.title}`;
            this.idCardTrait.style.color = this.chosenTrait.statColor;
            this.idCardTrait.style.borderColor = this.chosenTrait.statColor;
        }

        if (this.idCardBonusVal && this.chosenTrait) {
            this.idCardBonusVal.textContent = `${this.chosenTrait.statName} • ${this.chosenTrait.bonusDesc}`;
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        if (this.idCardRegNum) {
            this.idCardRegNum.textContent = `CIPHER-TRD-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        if (this.ceremonyAnnaSpeech) {
            this.ceremonyAnnaSpeech.textContent = `"축하합니다, ${this.nickname}님! 사이퍼 증권 트레이더 출입증 발급이 완료되었습니다. [${this.chosenTrait.title}] 성향으로 게임 내 ${this.chosenTrait.effect} 효과가 즉시 적용됩니다."`;
        }
    }

    open(initialMode = 'NEW') {
        this.initialMode = initialMode;
        this.setStep(1);

        const isDemo = this.initialMode === 'DEMO';
        if (this.motionControlGroup) {
            this.motionControlGroup.style.display = isDemo ? 'block' : 'none';
        }
        if (this.demoMotionInfoCard) {
            this.demoMotionInfoCard.style.display = isDemo ? 'flex' : 'none';
        }

        // Reset motion & bones to default idle state
        this.motion = 'idle';
        this.debugBones = false;
        if (this.btnToggleBones) {
            this.btnToggleBones.classList.remove('active');
        }
        document.querySelectorAll('.motion-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.motion === 'idle');
        });

        if (this.skeletonRenderer) {
            this.skeletonRenderer.playAnimation('idle');
            this.skeletonRenderer.toggleDebugBones(false);
        }

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
            direction: this.direction,
            trait: this.chosenTrait || this.traitsData.analysis,
            mode: this.initialMode
        };

        this.close();

        if (this.callbacks.onComplete) {
            this.callbacks.onComplete(userProfile);
        }
    }
}
