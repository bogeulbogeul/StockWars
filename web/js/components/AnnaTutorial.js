/**
 * AnnaTutorial Component
 * Visual Novel (미연시 스타일) Bottom Dialogue System & Onboarding Guide
 * Implements GDD CORE_GDD_10: Railroad Onboarding from Home Office to First Stock Purchase.
 */

export class AnnaTutorial {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.isActive = false;
        this.currentStepIdx = 0;
        this.typewriterTimer = null;
        this.isTyping = false;
        this.currentText = '';
        this.userProfile = { nickname: '파트너' };

        this.steps = [];
        this.render();
        this.initDOM();
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="annaTutorialOverlay" class="vn-tutorial-overlay hidden">
                <!-- Visual Novel Dialogue Box (Bottom Floating) -->
                <div class="vn-dialogue-box" id="vnDialogueBox">
                    <!-- Left: Anna Portrait Frame (Ready for image asset) -->
                    <div class="vn-portrait-frame" id="vnPortraitFrame">
                        <div class="vn-portrait-avatar" id="vnPortraitAvatar">
                            <span class="vn-portrait-emoji">👩‍💼</span>
                        </div>
                        <div class="vn-portrait-badge">MANAGER ANNA</div>
                    </div>

                    <!-- Right: Dialogue & Nameplate Content -->
                    <div class="vn-content-wrapper">
                        <!-- Top Nameplate & Controls Bar -->
                        <div class="vn-top-bar">
                            <div class="vn-nameplate">
                                <span class="vn-status-dot"></span>
                                <span class="vn-speaker-name" id="vnSpeakerName">전담 매니저 안나</span>
                                <span class="vn-speaker-title">Cipher Securities</span>
                            </div>
                            <div class="vn-controls">
                                <button class="vn-btn vn-skip-btn" id="btnVnSkip" title="튜토리얼 건너뛰기">⏩ 스킵</button>
                                <button class="vn-btn vn-next-btn" id="btnVnNext" title="다음 대사">다음 ▶</button>
                            </div>
                        </div>

                        <!-- Dialogue Text Area -->
                        <div class="vn-dialogue-body">
                            <div class="vn-dialogue-text" id="vnDialogueText">대사를 불러오는 중...</div>
                            <div class="vn-indicator-row">
                                <div class="vn-step-tracker" id="vnStepTracker">튜토리얼 가이드 (1/5)</div>
                                <span class="vn-next-indicator" id="vnNextIndicator">▼</span>
                            </div>
                        </div>

                        <!-- Interactive Step Action Button (Shown only on completion step) -->
                        <div class="vn-action-area hidden" id="vnActionArea">
                            <button class="vn-action-btn pulse-glow" id="btnVnAction"></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    initDOM() {
        this.overlay = document.getElementById('annaTutorialOverlay');
        this.dialogueBox = document.getElementById('vnDialogueBox');
        this.portraitAvatar = document.getElementById('vnPortraitAvatar');
        this.speakerName = document.getElementById('vnSpeakerName');
        this.dialogueText = document.getElementById('vnDialogueText');
        this.stepTracker = document.getElementById('vnStepTracker');
        this.nextIndicator = document.getElementById('vnNextIndicator');
        this.btnNext = document.getElementById('btnVnNext');
        this.btnSkip = document.getElementById('btnVnSkip');
        this.actionArea = document.getElementById('vnActionArea');
        this.btnAction = document.getElementById('btnVnAction');
    }

    initEventListeners() {
        // Click dialogue box to advance or speed up text
        this.dialogueBox?.addEventListener('click', (e) => {
            if (e.target.closest('#btnVnSkip') || e.target.closest('#btnVnAction')) {
                return;
            }
            this.handleAdvance();
        });

        this.btnNext?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleAdvance();
        });

        this.btnSkip?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.skip();
        });

        this.btnAction?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleActionClick();
        });
    }

    buildScenario(nickname = '파트너', targetStock = { id: 'CLOUDBERRY', name: '클라우드 베리' }, reason = null) {
        const stockName = targetStock.name;
        const stockId = targetStock.id;
        const recommendationLead = reason 
            ? `${nickname} 님의 투자 성향과 시장 분석 결과, ${reason}인 '${stockName}'을(를) 추천해요.`
            : `${nickname} 님의 투자 프로필과 오늘 시장 수급 분석 결과, 가장 확실한 상승 유망주 '${stockName}'을(를) 추천해요.`;

        return [
            // STEP 1: Welcome to Office
            {
                id: 'welcome_1',
                speaker: "전담 매니저 안나",
                text: `환영해요, ${nickname} 파트너님! 여기가 앞으로 우리가 함께할 전용 홈 오피스예요. 옥상에서 내려다보는 사이퍼 시티 전경이 정말 근사하죠?`,
                tracker: "1/5 • 오피스 환영 인사",
                actionBtnText: null,
                requiresManualAction: false,
                onEnter: () => {
                    this.cleanupHighlights();
                    // Ensure Home Office is focused
                    document.body.classList.remove('phone-view-active');
                    document.body.classList.add('phone-minimized');
                }
            },
            {
                id: 'welcome_2',
                speaker: "전담 매니저 안나",
                text: `사이퍼 증권 트레이더 등록 축하금으로 초기 지원금 5,000 Gold가 계좌로 안전하게 입금되었습니다.`,
                tracker: "1/5 • 초기 지원금 입금",
                actionBtnText: null,
                requiresManualAction: false,
                onEnter: () => {
                    this.cleanupHighlights();
                    if (this.callbacks.onGrantInitialFunds) {
                        this.callbacks.onGrantInitialFunds(5000);
                    }
                }
            },

            // STEP 2: Open Smartphone to Home Screen (User clicks floating phone button)
            {
                id: 'open_phone',
                speaker: "전담 매니저 안나",
                text: `본격적인 주식 매매를 위해 우측 하단의 [스마트폰] 버튼을 눌러 화면을 켜볼까요?`,
                tracker: "2/5 • 스마트폰 화면 켜기",
                actionBtnText: null, // No arbitrary auto-open button
                requiresManualAction: true,
                interactionHint: "우측 하단의 [스마트폰] 버튼을 클릭해 화면을 켜주세요!",
                targetSelector: '#floatingPhoneBtn',
                onEnter: () => {
                    this.highlightElement('#floatingPhoneBtn', true);
                    this.highlightElement('#btnToggleFrame', true);
                }
            },

            // STEP 3: Launch 사이퍼M Stock App from OS Home Screen
            {
                id: 'launch_stock_app',
                speaker: "전담 매니저 안나",
                text: `스마트폰이 켜졌네요! 홈 화면에서 [📈 사이퍼M] 주식 앱 아이콘을 터치해 HTS를 실행해 보세요!`,
                tracker: "2/5 • [📈 사이퍼M] HTS 앱 실행",
                actionBtnText: null,
                requiresManualAction: true,
                interactionHint: "홈 화면의 [📈 사이퍼M] 앱 아이콘을 클릭해주세요!",
                targetSelector: '#iconStockApp',
                onEnter: () => {
                    this.highlightElement('#iconStockApp', true);
                }
            },

            // STEP 4: Navigate to Stock Market Tab (User clicks [주식 거래] tab)
            {
                id: 'market_tab',
                speaker: "전담 매니저 안나",
                text: `사이버 시티 모바일 HTS에 접속했습니다! 하단 메뉴에서 [📈 주식 거래] 탭을 눌러 시장에서 거래 중인 종목들을 확인해 보세요.`,
                tracker: "3/5 • 주식 시장 탐색",
                actionBtnText: null,
                requiresManualAction: true,
                interactionHint: "스마트폰 하단의 [📈 주식 거래] 탭을 터치해주세요!",
                targetSelector: '.nav-tab[data-tab="Market"]',
                onEnter: () => {
                    this.highlightElement('.nav-tab[data-tab="Market"]', true);
                }
            },

            // STEP 5: Recommend Dynamic Stock & Open Trade Modal
            {
                id: 'select_stock',
                speaker: "전담 매니저 안나",
                text: `${recommendationLead} '${stockName}'을(를) 눌러 매매 창을 열어보세요!`,
                tracker: `4/5 • '${stockName}' 선택`,
                actionBtnText: null,
                requiresManualAction: true,
                interactionHint: `종목 목록에서 '${stockName}'을(를) 클릭해 매매 창을 열어주세요!`,
                targetSelector: `.stock-item-row[data-id="${stockId}"]`,
                onEnter: () => {
                    this.highlightStock(stockId, true);
                }
            },

            // STEP 6: Buy Order Execution (User clicks Buy button)
            {
                id: 'buy_stock',
                speaker: "전담 매니저 안나",
                text: `실시간 5단 호가창과 차트를 확인하셨나요? 하단의 [📈 매수 (BUY)] 버튼을 눌러 '${stockName}' 1주를 매수해 보세요!`,
                tracker: `4/5 • '${stockName}' 1주 매수`,
                actionBtnText: null,
                requiresManualAction: true,
                interactionHint: `매매 창의 [📈 매수 (BUY)] 버튼을 눌러 '${stockName}' 1주 매수 주문을 완료하세요!`,
                targetSelector: '#btnBuyExecute',
                onEnter: () => {
                    this.highlightElement('#btnBuyExecute', true);
                }
            },

            // STEP 6: Celebration & Portfolio Guide
            {
                id: 'celebrate',
                speaker: "전담 매니저 안나",
                text: `축하합니다! '${stockName}' 1주 매수 주문이 성공적으로 체결되었습니다! 🎉 벌써 주가가 오르며 실시간 수익이 발생하고 있어요.`,
                tracker: "5/5 • 첫 매수 체결 성공 (수익 달성)",
                actionBtnText: null,
                requiresManualAction: false,
                onEnter: () => {
                    this.cleanupHighlights();
                }
            },
            {
                id: 'portfolio_guide',
                speaker: "전담 매니저 안나",
                text: `매수한 주식은 스마트폰의 [👤 내 계좌] 탭에서 방금 매수한 '${stockName}'의 실시간 플러스(+) 수익률과 평가 손익을 언제든 확인할 수 있답니다.`,
                tracker: "5/5 • 포트폴리오 관리 안내",
                actionBtnText: null,
                requiresManualAction: false,
                onEnter: () => {}
            },
            {
                id: 'complete',
                speaker: "전담 매니저 안나",
                text: `이제 7일 동안 다양한 종목 분석과 기업 공시 및 뉴스를 활용해 자산을 극대화하고 월세를 완납해 보세요. 최고의 펀드 매니저가 되는 날까지 제가 늘 함께할게요! 화이팅!`,
                tracker: "5/5 • 튜토리얼 완료",
                actionBtnText: "🚀 거래 시작하기 (완료)",
                requiresManualAction: false,
                onEnter: () => {},
                onAction: () => {
                    this.complete();
                }
            }
        ];
    }

    start(userProfile = {}, recommendation = null) {
        this.cleanupHighlights();
        this.userProfile = userProfile;
        this.recommendation = recommendation;
        this.targetStock = recommendation?.stock || { id: 'CLOUDBERRY', name: '클라우드 베리', price: 850 };
        const nickname = userProfile.nickname || '파트너';
        this.steps = this.buildScenario(nickname, this.targetStock, recommendation?.reason);
        this.currentStepIdx = 0;
        this.isActive = true;

        this.overlay?.classList.remove('hidden');
        this.showCurrentStep();
    }

    showCurrentStep() {
        if (!this.isActive || this.currentStepIdx >= this.steps.length) {
            this.complete();
            return;
        }

        // Clean up previous highlights first so only current step targets are active
        this.cleanupHighlights();

        const step = this.steps[this.currentStepIdx];
        if (this.speakerName) this.speakerName.textContent = step.speaker;
        if (this.stepTracker) this.stepTracker.textContent = step.tracker;

        // Action button handling
        if (step.actionBtnText && this.actionArea && this.btnAction) {
            this.btnAction.textContent = step.actionBtnText;
            this.actionArea.classList.remove('hidden');
        } else if (this.actionArea) {
            this.actionArea.classList.add('hidden');
        }

        // Execute step enter hook
        if (step.onEnter) {
            step.onEnter();
        }

        // Typewriter animation
        this.typeText(step.text);
    }

    typeText(fullText) {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        this.currentText = fullText;
        this.isTyping = true;
        if (this.nextIndicator) this.nextIndicator.style.opacity = '0';

        let charIdx = 0;
        if (this.dialogueText) this.dialogueText.textContent = '';

        this.typewriterTimer = setInterval(() => {
            charIdx++;
            if (this.dialogueText) {
                this.dialogueText.textContent = fullText.slice(0, charIdx);
            }

            if (charIdx >= fullText.length) {
                this.finishTyping();
            }
        }, 20);
    }

    finishTyping() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.isTyping = false;
        if (this.dialogueText) this.dialogueText.textContent = this.currentText;
        if (this.nextIndicator) this.nextIndicator.style.opacity = '1';
    }

    handleAdvance() {
        if (this.isTyping) {
            this.finishTyping();
            return;
        }

        const step = this.steps[this.currentStepIdx];
        if (!step) return;

        // If step requires manual interaction on the UI (e.g. clicking phone button, tab, stock, buy), do not auto-advance arbitrarily!
        if (step.requiresManualAction) {
            if (step.targetSelector) {
                const target = document.querySelector(step.targetSelector);
                if (target) {
                    target.classList.add('tutorial-target-shake');
                    setTimeout(() => target.classList.remove('tutorial-target-shake'), 600);
                }
            }
            if (step.interactionHint && window.toastManager) {
                window.toastManager.show(`💡 ${step.interactionHint}`);
            }
            return;
        }

        // If current step has explicit finish button
        if (step.onAction && step.actionBtnText) {
            this.handleActionClick();
            return;
        }

        this.nextStep();
    }

    handleActionClick() {
        const step = this.steps[this.currentStepIdx];
        if (step && step.onAction) {
            step.onAction();
        } else {
            this.nextStep();
        }
    }

    nextStep() {
        this.currentStepIdx++;
        if (this.currentStepIdx < this.steps.length) {
            this.showCurrentStep();
        } else {
            this.complete();
        }
    }

    // Called when player buys first stock during tutorial
    notifyStockPurchased(stockId) {
        if (!this.isActive) return;
        this.highlightElement('#btnBuyExecute', false);
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && (currentStep.id === 'buy_stock' || currentStep.id === 'select_stock')) {
            const celebIdx = this.steps.findIndex(s => s.id === 'celebrate');
            if (celebIdx !== -1) {
                this.currentStepIdx = celebIdx;
                this.showCurrentStep();
            } else {
                this.nextStep();
            }
        }
    }

    // Called when player manually clicks smartphone toggle button
    notifyPhoneOpened() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'open_phone') {
            this.highlightElement('#floatingPhoneBtn', false);
            this.highlightElement('#btnToggleFrame', false);
            this.nextStep();
        }
    }

    // Called when player manually launches 사이퍼M stock app from OS Home screen
    notifyStockAppOpened() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'launch_stock_app') {
            this.highlightElement('#iconStockApp', false);
            this.nextStep();
        }
    }

    // Called when player manually switches to Market tab
    notifyTabSwitched(tabName) {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (tabName === 'Market' && currentStep && currentStep.id === 'market_tab') {
            this.highlightElement('.nav-tab[data-tab="Market"]', false);
            this.nextStep();
        }
    }

    // Called when player manually opens trade modal for recommended stock
    notifyTradeModalOpened(stockId) {
        if (!this.isActive) return;
        const targetId = this.targetStock?.id || 'CLOUDBERRY';
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'select_stock' && (stockId === targetId || !stockId)) {
            this.highlightStock(targetId, false);
            this.nextStep();
        }
    }

    highlightElement(selector, enable) {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.toggle('tutorial-pulse-target', enable);
        }
    }

    highlightStock(stockId, enable) {
        const row = document.querySelector(`.stock-item-row[data-id="${stockId}"]`);
        if (row) {
            row.classList.toggle('tutorial-pulse-target', enable);
        }
    }

    skip() {
        this.cleanupHighlights();
        this.complete(true);
    }

    complete(isSkipped = false) {
        this.isActive = false;
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.cleanupHighlights();
        this.overlay?.classList.add('hidden');

        if (this.callbacks.onComplete) {
            this.callbacks.onComplete({ skipped: isSkipped });
        }
    }

    cleanupHighlights() {
        document.querySelectorAll('.tutorial-pulse-target').forEach(el => {
            el.classList.remove('tutorial-pulse-target');
        });
    }
}
