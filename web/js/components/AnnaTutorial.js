import { annaLessonScreen } from './tutorial/annaLessonScreen.js';
import { applyAnnaTradeFocus, clearAnnaTradeFocus } from './tutorial/annaTradeFocus.js';
import { installAnnaInputGuard } from './tutorial/annaInputGuard.js';
import { tutorialShortcutDestination } from './tutorial/tutorialPresentation.js';
import { gameKey } from '../app/GameKeys.js';
import { installAnnaDialogueLayout } from './tutorial/annaDialogueLayout.js';
import { buildAnnaScenario } from './tutorial/annaTutorialScenario.js';
import { renderAnnaLesson } from './tutorial/compactAnnaLessons.js';
import { tutorialChapters, tutorialCheckpoint, nextTutorialChapter } from './tutorial/tutorialCheckpoint.js';

export class AnnaTutorial {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.callbacks = callbacks;
        this.isActive = false;
        this.lessonEnabled = false;
        this.currentStepIdx = 0;
        this.typewriterTimer = null;
        this.isTyping = false;
        this.currentText = '';
        this.userProfile = { nickname: '파트너' };

        this.dialogueHistory = [];
        this.historyCursor = null;
        this.steps = [];
        this.render();
        this.initDOM();
        installAnnaDialogueLayout(this.overlay);
        this.inputKey = gameKey;
        this.removeInputGuard = installAnnaInputGuard(this);
        this.initEventListeners();
    }

    render() {
        const html = `
            <div id="annaTutorialOverlay" class="vn-tutorial-overlay hidden">
                <!-- Visual Novel Dialogue Box (Bottom Floating) -->
                <div class="vn-dialogue-box" id="vnDialogueBox">
                    <!-- Left: Anna expression portrait -->
                    <div class="vn-portrait-frame" id="vnPortraitFrame">
                        <div class="vn-portrait-avatar" id="vnPortraitAvatar">
                            <span class="anna-portrait" id="vnAnnaPortrait" data-expression="Standard" role="img" aria-label="안나 — 기본 표정"></span>
                        </div>
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
                                <button class="vn-btn vn-skip-btn" id="btnVnSkip" title="현재 챕터 건너뛰기">건너뛰기</button>
                                <button class="vn-btn vn-prev-btn" id="btnVnPrevious" title="이전 대사 다시 보기" disabled>◀ 이전</button>
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
                            <button class="vn-action-btn" id="btnVnAction"></button>
                            <button class="vn-action-btn vn-action-secondary hidden" id="btnVnHold">계속 보유하기</button>
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
        this.portrait = document.getElementById('vnAnnaPortrait');
        this.speakerName = document.getElementById('vnSpeakerName');
        this.dialogueText = document.getElementById('vnDialogueText');
        this.stepTracker = document.getElementById('vnStepTracker');
        this.nextIndicator = document.getElementById('vnNextIndicator');
        this.btnNext = document.getElementById('btnVnNext');
        this.btnPrevious = document.getElementById('btnVnPrevious');
        this.btnSkip = document.getElementById('btnVnSkip');
        this.actionArea = document.getElementById('vnActionArea');
        this.btnAction = document.getElementById('btnVnAction');
        this.btnHold = document.getElementById('btnVnHold');
        const header = this.dialogueBox.querySelector('.vn-top-bar');
        header.prepend(this.dialogueBox.querySelector('.vn-portrait-frame'));
        const controls = this.dialogueBox.querySelector('.vn-controls');
        this.dialogueBox.querySelector('.vn-content-wrapper').append(controls);
        header.append(this.btnSkip);
        controls.insertBefore(this.actionArea, this.btnNext);

    }

    initEventListeners() {
        this.btnHold?.addEventListener('click', (e) => {
            e.stopPropagation();
            const lesson = this.callbacks.getFirstTradeLesson?.();
            if (!lesson || !this.lessonResume) return;
            lesson.status = 'holding';
            this.callbacks.onSaveLesson?.();
            this.finishLesson();
        });
        // Click dialogue box to advance or speed up text
        this.dialogueBox?.addEventListener('click', (e) => {
            if (e.target.closest('#btnVnSkip') || e.target.closest('#btnVnAction')) {
                return;
            }
            this.handleAdvance();
        });

        this.btnPrevious?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPreviousDialogue();
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

        // Keyboard navigation: Enter to advance dialogue
        window.addEventListener('keydown', (e) => {
            if (!this.isActive || this.overlay?.classList.contains('hidden')) return;
            if (document.activeElement?.tagName === 'BUTTON') return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            if (gameKey(e) === 'enter' && !e.repeat) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAdvance();
            }
        });
    }

    start(userProfile = {}, recommendation = null, checkpoint = null) {
        this.lessonResume = null;
        this.dialogueHistory = [];
        this.historyCursor = null;
        this.lessonEnabled = true;
        this.cleanupHighlights();
        this.userProfile = userProfile;
        this.recommendation = recommendation;
        this.targetStock = recommendation?.stock || { id: null, name: '구매 가능한 종목' };
        this.stopRecommendationReview();
        this.firstPurchaseDone = false;
        this.recommendationTimer = setInterval(() => this.reviewRecommendation(), 10000);
        const nickname = userProfile.nickname || '파트너';

        this.steps = buildAnnaScenario({
            nickname,
            targetStock: this.targetStock,
            reason: recommendation?.reason,
            callbacks: this.callbacks,
            highlightElement: (sel, en) => this.highlightElement(sel, en),
            highlightStock: (id, en) => this.highlightStock(id, en),
            cleanupHighlights: () => this.cleanupHighlights(),
            overlay: this.overlay
        });

        this.currentStepIdx = 0;
        if (checkpoint) {
            const chapter = tutorialChapters.find(([id]) => id === checkpoint) || tutorialChapters[0];
            const targetIndex = this.steps.findIndex(step => step.id === chapter[0]);
            this.firstPurchaseDone = !!this.callbacks.getFirstTradeLesson?.();
            if (this.firstPurchaseDone) this.stopRecommendationReview();
            this.steps.unshift({
                id: 'tutorial_resume', speaker: '전담 매니저 안나', expression: 'Smile',
                tracker: '튜토리얼 이어하기', lessonTitle: '돌아오셨네요, 파트너!',
                text: `다시 만나서 반가워요!\n‘${chapter[1]}’부터 이어갈까요?`,
                example: { label: '이어서 배울 내용', rows: [chapter[1], '이미 받은 보상과 거래 결과는 그대로 유지돼요.'] },
                requiresManualAction: true, actionBtnText: '이어서 시작하기 →',
                onAction: () => {
                    this.steps.shift();
                    this.resumeChapter(chapter[0], targetIndex);
                }
            });
        }
        this.isActive = true;
        this.overlay?.classList.remove('hidden');
        this.showCurrentStep();
        this.callbacks.onRecommendationChanged?.();
    }

    resumeChapter(chapterId, targetIndex) {
        this.currentStepIdx = Math.max(0, targetIndex);
        if (chapterId === 'celebrate') {
            const accountIndex = this.steps.findIndex(step => step.id === 'portfolio_guide');
            if (accountIndex >= 0) this.currentStepIdx = accountIndex;
        }
        this.dialogueHistory = this.steps.slice(0, this.currentStepIdx)
            .filter(step => step.id !== 'tutorial_resume').map(step => ({ ...step }));
        this.historyCursor = null;
        this.reviewingScreen = false;
        this.restoringScreen = true;
        try { this.callbacks.onRestoreTutorialChapter?.(chapterId); }
        finally { this.restoringScreen = false; }
        this.showCurrentStep();
    }

    stopRecommendationReview() {
        if (this.recommendationTimer) clearInterval(this.recommendationTimer);
        this.recommendationTimer = null;
    }

    reviewRecommendation() {
        if (!this.isActive || this.firstPurchaseDone || this.lessonResume) return;
        // Initial grant is delivered by welcome_2, not by recommendation recovery.
        if (this.steps[this.currentStepIdx]?.id === 'welcome_1') return;
        if (this.steps[this.currentStepIdx]?.id === 'tutorial_resume') return;
        const recommendation = this.callbacks.onRefreshRecommendation?.();
        if (recommendation) this.applyRecommendation(recommendation);
    }

    syncRecommendation() {
        if (!this.isActive || this.firstPurchaseDone) return;
        const id = this.callbacks.getTutorialTargetId?.();
        if (id === undefined || id === this.targetStock?.id) return;
        const state = this.callbacks.getMarketState?.();
        this.applyRecommendation({ stock: state?.stocks.find(s => s.id === id) || null });
    }

    applyRecommendation(recommendation) {
        const stepId = this.steps[this.currentStepIdx]?.id;
        this.recommendation = recommendation;
        this.targetStock = recommendation.stock || { id: null, name: '구매 가능한 종목' };
        const next = buildAnnaScenario({ nickname: this.userProfile.nickname || '파트너', targetStock: this.targetStock,
            reason: recommendation.reason, callbacks: this.callbacks,
            highlightElement: (sel, en) => this.highlightElement(sel, en),
            highlightStock: (id, en) => this.highlightStock(id, en),
            cleanupHighlights: () => this.cleanupHighlights(), overlay: this.overlay });
        this.steps = next;
        this.currentStepIdx = Math.max(0, next.findIndex(s => s.id === stepId));
        if (['select_stock', 'buy_stock'].includes(stepId)) {
            const step = next[this.currentStepIdx];
            step.text = recommendation.stock
                ? `추천 종목이 바뀌었어요. '${this.targetStock.name}'을 ${stepId === 'buy_stock' ? '[시장가 · 1주]로 매수해 주세요.' : '목록에서 눌러 주세요.'}`
                : '현재 현금으로 살 수 있는 종목이 없어요. 시장을 계속 확인할게요. 구매 가능한 종목이 생기면 다시 추천해 드릴게요.';
            this.showCurrentStep();
        }
        this.callbacks.onRecommendationChanged?.();
    }

    showCurrentStep() {
        this.callbacks.onActivityChanged?.();
        if (!this.isActive || this.currentStepIdx >= this.steps.length) {
            this.complete();
            return;
        }

        // Clean up previous highlights first so only current step targets are active
        this.cleanupHighlights();

        const step = this.steps[this.currentStepIdx];
        if (step.id === 'celebrate') {
            const state = this.callbacks.getMarketState?.();
            const lesson = this.callbacks.getFirstTradeLesson?.();
            const holding = state?.portfolio.find(p => p.id === this.targetStock?.id && !p.isShort);
            if (holding && lesson) {
                step.text = "'" + this.targetStock.name + "'을 샀어요! 오른쪽 위 [✕]를 눌러 내 계좌를 확인하러 가요.";
                step.cards = [['보유', holding.qty + '주'], ['매수가', lesson.buyPrice.toLocaleString() + 'G'], ['남은 현금', state.cash.toLocaleString() + 'G']];
            }
        }
        this.historyCursor = null;
        const snapshot = { ...step };
        const last = this.dialogueHistory?.at(-1);
        if (!this.dialogueHistory) this.dialogueHistory = [];
        if (step.id !== 'tutorial_resume') {
            if (last?.id === step.id) this.dialogueHistory[this.dialogueHistory.length - 1] = snapshot;
            else this.dialogueHistory.push(snapshot);
        }
        this.renderDialogue(step);
        if (step.onEnter) step.onEnter();
        applyAnnaTradeFocus(step.id, undefined, step.chartIntroTarget);
        if (!this.lessonResume && step.id !== 'tutorial_resume') {
            this.callbacks.onCheckpoint?.(tutorialCheckpoint(this.steps, this.currentStepIdx));
        }
    }

    renderDialogue(step, reviewing = false) {
        if (reviewing || this.reviewingScreen || ['portfolio_guide', 'news_tab_guide', 'hts_home_overview'].includes(step.id)) {
            this.restoringScreen = true;
            try {
                this.callbacks.onRestoreLessonScreen?.(annaLessonScreen(step, this.steps), this.targetStock?.id);
            } finally { this.restoringScreen = false; }
        }
        this.reviewingScreen = reviewing;
        document.querySelectorAll('.tutorial-pulse-target').forEach(element => element.classList.remove('tutorial-pulse-target'));
        const reviewTarget = step.targetSelector || ({ news_reading_guide: '#newsListContainer', trade_history_guide: '.trade-history-menu > summary', trade_history_fees: '#tradeHistoryList', portfolio_slots_guide: '#portfolioSlotStatus' })[step.id];
        if (reviewTarget) this.highlightElement(reviewTarget, true);
        const chartTour = !!step.chartIntroTarget;
        if (chartTour || this.chartTourVisible) this.callbacks.onTutorialChartVisibility?.(chartTour);
        this.chartTourVisible = chartTour;
        this.overlay?.classList.toggle('vn-chart-tour', chartTour);
        if (step.id === 'hts_home_overview') {
            const scroller = document.querySelector('#stockApp .app-body');
            if (scroller) scroller.scrollTop = 0;
        }
        if (step.id === 'portfolio_overview') {
            const history = document.querySelector('#stockApp .trade-history-menu');
            if (history) history.open = false;
            const scroller = document.querySelector('#stockApp .app-body');
            if (scroller) scroller.scrollTop = 0;
        }
        applyAnnaTradeFocus(step.id, undefined, step.chartIntroTarget);
        this.callbacks.onInputStepChanged?.();
        this.overlay?.classList.toggle('vn-phone-focus', step.id === 'open_phone' && !reviewing);
        this.overlay?.classList.toggle('vn-app-focus', !!step.appIntroTarget || step.id === 'launch_stock_app');
        this.overlay?.classList.toggle('vn-app-tour', !!step.appIntroTarget);
        this.overlay?.classList.toggle('vn-stock-focus', step.id === 'select_stock');
        document.querySelectorAll('.hts-tour-target').forEach(target => target.classList.remove('hts-tour-target'));
        const htsTarget = step.htsIntroTarget || (step.id === 'market_tab' ? '#stockApp .nav-tab[data-tab="Market"]' : step.id === 'portfolio_guide' ? '#stockApp .nav-tab[data-tab="Profile"]' : step.id === 'news_tab_guide' ? '#stockApp .nav-tab[data-tab="News"]' : null);
        this.overlay?.classList.toggle('vn-hts-focus', !!htsTarget);
        if (step.htsIntroTarget && this.callbacks.getCurrentTutorialTab?.() !== 'Home') this.callbacks.onNavigateTutorial?.('Home');
        if (htsTarget) {
            const target = document.querySelector(htsTarget);
            target?.classList.add('hts-tour-target');
            const scroller = target?.closest('.app-body');
            if (scroller) {
                const rect = target.getBoundingClientRect(), bounds = scroller.getBoundingClientRect();
                const scale = bounds.height / scroller.offsetHeight || 1;
                if (rect.top < bounds.top + 8) scroller.scrollTop += (rect.top - bounds.top) / scale - 8;
                else if (rect.bottom > bounds.bottom - 8) scroller.scrollTop += (rect.bottom - bounds.bottom) / scale + 8;
            }
        }

        document.querySelectorAll('#homeScreen .app-icon-item.tutorial-pulse-target').forEach(icon => icon.classList.remove('tutorial-pulse-target'));
        if (step.appIntroTarget) this.highlightElement(step.appIntroTarget, true);
        else if (step.id === 'launch_stock_app') this.highlightElement('#iconStockApp', true);
        this.overlay?.classList.toggle('vn-movement-guide', ['go_town_proposal', 'enter_logistics'].includes(step.id));
        const destination = tutorialShortcutDestination(step.id);
        const accountOpen = destination?.tab === 'Profile'
            && ['Profile', 'Account'].includes(this.callbacks.getCurrentTutorialTab?.())
            && !this.callbacks.isTradeModalOpen?.();
        const shortcut = !['open_phone', 'launch_stock_app', 'market_tab'].includes(step.id) && destination && !accountOpen && this.historyCursor === null ? { label: destination.label, run: () => {
            if (this.steps[this.currentStepIdx]?.id !== step.id || this.historyCursor !== null) return;
            if (destination.tab) {
                this.callbacks.onNavigateTutorial?.(destination.tab);
                if (destination.openRecommendedStock && this.targetStock?.id) {
                    this.callbacks.onOpenTradeModal?.(this.targetStock.id);
                }
            }
            else document.querySelector(destination.selector)?.click();
        } } : undefined;
        const presentationText = renderAnnaLesson(this.dialogueBox?.querySelector('.vn-dialogue-body'), step, shortcut, { focused: true });
        this.dialogueBox?.querySelector('.vn-rumor-choices')?.remove();
        if (step.choices && !reviewing) {
            const choices = document.createElement('div');
            choices.className = 'vn-rumor-choices';
            choices.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px';
            for (const choice of step.choices) {
                const button = document.createElement('button');
                button.className = 'vn-btn';
                button.textContent = choice.label;
                button.addEventListener('click', event => {
                    event?.stopPropagation();
                    if (!this.isActive || this.steps[this.currentStepIdx] !== step || this.historyCursor != null) return;
                    const feedback = this.steps[this.currentStepIdx + 1];
                    feedback.baseText ??= feedback.text;
                    feedback.text = choice.feedback;
                    feedback.detailText = feedback.baseText;
                    this.nextStep();
                });
                choices.append(button);
            }
            this.dialogueBox?.querySelector('.vn-dialogue-body')?.append(choices);
        }
        this.btnHold?.classList.toggle('hidden', !step.allowHold);
        const needsChoice = !!step.allowHold;
        this.dialogueBox?.classList.toggle('has-choice', needsChoice);
        this.btnNext?.classList.toggle('hidden', needsChoice || !!step.choices || !!step.actionBtnText);
        this.nextIndicator?.classList.toggle('hidden', !!step.requiresManualAction || !!step.actionBtnText);
        this.setExpression(step.expression);
        if (this.speakerName) this.speakerName.textContent = step.speaker?.includes('안나') ? '안나' : step.speaker;
        if (this.stepTracker) this.stepTracker.textContent = step.tracker;

        // Action button handling
        if (step.actionBtnText && this.actionArea && this.btnAction) {
            this.btnAction.textContent = step.actionBtnText;
            this.actionArea.classList.remove('hidden');
        } else if (this.actionArea) {
            this.actionArea.classList.add('hidden');
        }

        if (reviewing) {
            this.btnHold?.classList.add('hidden');
            this.actionArea?.classList.add('hidden');
            this.btnNext?.classList.remove('hidden');
            this.nextIndicator?.classList.remove('hidden');
            this.dialogueBox?.classList.remove('has-choice');
        }
        if (this.btnNext) this.btnNext.disabled = reviewing
            ? ['#iconStockApp', '#btnCloseTradeModal', '#btnCloseDetailedChartModal', '.nav-tab[data-tab="Profile"]', '.nav-tab[data-tab="News"]', '.nav-tab[data-tab="Market"]'].includes(step.targetSelector)
            : !!step.requiresManualAction;
        if (this.btnPrevious) this.btnPrevious.disabled = (this.historyCursor ?? this.dialogueHistory.length - 1) <= 0;
        this.typeText(presentationText || step.text);
    }

    showPreviousDialogue() {
        if (!this.isActive) return;
        const cursor = this.historyCursor ?? this.dialogueHistory.length - 1;
        if (cursor <= 0) return;
        this.historyCursor = cursor - 1;
        this.renderDialogue(this.dialogueHistory[this.historyCursor], true);
    }


    setExpression(expression = 'Standard') {
        const labels = { Standard: '기본', Smile: '미소', Happy: '기쁨', Pain: '걱정', Angry: '분노' };
        const resolved = Object.hasOwn(labels, expression) ? expression : 'Standard';
        if (this.portrait) {
            this.portrait.dataset.expression = resolved;
            this.portrait.setAttribute('aria-label', `안나 — ${labels[resolved]} 표정`);
        }
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

    advanceHistory() {
        this.historyCursor++;
        if (this.historyCursor >= this.dialogueHistory.length - 1) {
            this.historyCursor = null;
            this.renderDialogue(this.steps[this.currentStepIdx]);
        } else this.renderDialogue(this.dialogueHistory[this.historyCursor], true);
    }

    handleAdvance() {
        if (this.isTyping) {
            this.finishTyping();
            return;
        }

        if (this.historyCursor !== null && this.historyCursor !== undefined) {
            const step = this.dialogueHistory[this.historyCursor];
            if (['#iconStockApp', '#btnCloseTradeModal', '#btnCloseDetailedChartModal', '.nav-tab[data-tab="Profile"]', '.nav-tab[data-tab="News"]', '.nav-tab[data-tab="Market"]'].includes(step?.targetSelector)) return;
            this.advanceHistory();
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
        if (this.historyCursor != null) return;
        const step = this.steps[this.currentStepIdx];
        if (step && step.onAction) {
            step.onAction(this);
        } else {
            this.nextStep();
        }
    }

    nextStep() {
        this.currentStepIdx++;
        if (!this.lessonResume && this.tryShowLesson()) return;
        if (this.currentStepIdx < this.steps.length) {
            this.showCurrentStep();
        } else {
            this.complete();
        }
    }

    // Called when player buys first stock during tutorial
    notifyStockPurchased(stockId) {
        if (!this.isActive || stockId !== this.targetStock?.id) return;
        this.firstPurchaseDone = true;
        this.stopRecommendationReview();
        this.highlightElement('#btnBuyExecute', false);
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && ['buy_stock', 'select_stock', 'chart_colors', 'chart_detail', 'market_order_guide', 'limit_order_guide'].includes(currentStep.id)) {
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
    notifyDetailedChart(open) {
        if (!open && this.isActive && !this.restoringScreen && this.historyCursor != null
            && this.dialogueHistory[this.historyCursor]?.targetSelector === '#btnCloseDetailedChartModal') {
            this.advanceHistory();
            return;
        }
        if (!this.isActive || this.restoringScreen || this.historyCursor !== null) return;
        const id = this.steps[this.currentStepIdx]?.id;
        if ((open && id === 'chart_detail') || (!open && id === 'chart_tour_close')) this.nextStep();
    }

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
        if (!this.isActive || this.restoringScreen) return;
        if (this.historyCursor != null) {
            if (this.dialogueHistory[this.historyCursor]?.id === 'launch_stock_app') this.advanceHistory();
            return;
        }
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'launch_stock_app') {
            this.highlightElement('#iconStockApp', false);
            this.nextStep();
        }
    }

    // Called when player manually switches tabs (e.g. Market, Profile/Account)
    notifyTabSwitched(tabName) {
        if (this.isActive && !this.restoringScreen && this.historyCursor != null
            && ((this.dialogueHistory[this.historyCursor]?.id === 'portfolio_guide' && ['Profile', 'Account'].includes(tabName))
                || (this.dialogueHistory[this.historyCursor]?.id === 'news_tab_guide' && tabName === 'News')
                || (this.dialogueHistory[this.historyCursor]?.id === 'market_tab' && tabName === 'Market'))) {
            this.advanceHistory();
            return;
        }
        if (!this.isActive || this.restoringScreen || this.historyCursor !== null) return;
        const destination = tutorialShortcutDestination(this.steps[this.currentStepIdx]?.id);
        if (destination?.tab === 'Profile' && ['Profile', 'Account'].includes(tabName)) {
            this.dialogueBox?.querySelector('.tutorial-shortcut-btn')?.remove();
        }
        const currentStep = this.steps[this.currentStepIdx];
        if (!currentStep) return;

        if (tabName === 'Market' && currentStep.id === 'market_tab') {
            this.highlightElement('.nav-tab[data-tab="Market"]', false);
            this.nextStep();
        } else if (tabName === 'News' && currentStep.id === 'news_tab_guide') {
            this.highlightElement('.nav-tab[data-tab="News"]', false);
            this.nextStep();
        } else if ((tabName === 'Profile' || tabName === 'Account') && (currentStep.id === 'portfolio_guide' || currentStep.id === 'celebrate')) {
            this.highlightElement('.nav-tab[data-tab="Profile"]', false);
            if (currentStep.id === 'celebrate') {
                const portfolioIdx = this.steps.findIndex(s => s.id === 'portfolio_guide');
                if (portfolioIdx !== -1) {
                    this.currentStepIdx = portfolioIdx;
                    this.nextStep();
                    return;
                }
            }
            this.nextStep();
        }
    }

    notifyTradeModalClosed() {
        if (this.isActive && !this.restoringScreen && this.historyCursor != null
            && this.dialogueHistory[this.historyCursor]?.targetSelector === '#btnCloseTradeModal') {
            this.advanceHistory();
            return;
        }
        if (!this.isActive || this.restoringScreen || this.historyCursor !== null) return;
        const id = this.steps[this.currentStepIdx]?.id;
        if (id === 'celebrate') {
            const index = this.steps.findIndex(step => step.id === 'portfolio_guide');
            if (index >= 0) { this.currentStepIdx = index; this.showCurrentStep(); }
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

    // Called when player enters public town from office
    notifyTownEntered() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'go_town_proposal') {
            this.cleanupHighlights();
            const logisticsStepIdx = this.steps.findIndex(s => s.id === 'enter_logistics');
            if (logisticsStepIdx !== -1) {
                this.currentStepIdx = logisticsStepIdx;
                this.showCurrentStep();
            } else {
                this.nextStep();
            }
        }
    }

    // Called when player enters Bit Logistics mini-game modal
    notifyLogisticsOpened() {
        if (!this.isActive) return;
        this.cleanupHighlights();
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && (currentStep.id === 'enter_logistics' || currentStep.id === 'go_town_proposal')) {
            // Temporarily hide Anna overlay so Manager Park's dedicated VN tutorial can take over
            this.overlay?.classList.add('hidden');
        }
    }

    // Called when player completes Bit Logistics labor job and returns
    notifyLogisticsJobCompleted(result) {
        if (!this.isActive) return;
        const nextStepIdx = this.steps.findIndex(s => s.id === 'rumor_inventory_guide' || s.id === 'logistics_completed');
        if (nextStepIdx !== -1) {
            this.isActive = true;
            this.currentStepIdx = nextStepIdx;
            this.overlay?.classList.remove('hidden');
            this.showCurrentStep();
        }
    }

    // Called when player opens inventory modal
    notifyInventoryOpened() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'rumor_inventory_guide') {
            this.highlightElement('#btnHudInventory', false);
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
        if (!this.isActive) return;
        const next = nextTutorialChapter(this.steps, this.currentStepIdx, this.userProfile?.tutorialCheckpoint);
        this.cleanupHighlights();
        this.callbacks.onTutorialChartVisibility?.(false);
        this.chartTourVisible = false;
        this.overlay?.classList.remove('vn-chart-tour');
        if (!next || this.lessonResume) { this.complete(true); return; }
        // Keep skipped explanations in history without running their actions or rewards.
        this.dialogueHistory ??= [];
        const historyStart = this.steps[this.currentStepIdx]?.id === 'tutorial_resume'
            ? Math.max(0, this.steps.findIndex(step => step.id === this.userProfile?.tutorialCheckpoint))
            : this.currentStepIdx;
        for (const step of this.steps.slice(historyStart, next.index)) {
            if (step.id !== 'tutorial_resume' && !this.dialogueHistory.some(entry => entry.id === step.id)) {
                this.dialogueHistory.push({ ...step });
            }
        }
        // Skipping the welcome must not leave the trading lesson without starter funds.
        if (next.id === 'open_phone') this.callbacks.onGrantInitialFunds?.(5000);
        this.currentStepIdx = next.index;
        if (next.id === 'celebrate') {
            // No purchase is invented when the trading chapter was skipped.
            this.currentStepIdx = this.steps.findIndex(step => step.id === 'portfolio_guide');
            this.stopRecommendationReview();
        }
        if (next.id === 'rumor_inventory_guide') {
            this.steps[next.index].text = '소지품에서 찌라시를 확인할 수 있어요. 위쪽 [소지품]을 눌러 주세요.';
        }
        this.historyCursor = null;
        this.callbacks.onSkipTutorialChapter?.(next.id);
        this.showCurrentStep();
    }

    complete(isSkipped = false) {
        if (this.lessonResume) {
            const lesson = this.callbacks.getFirstTradeLesson?.();
            if (lesson && lesson.status !== 'sold') lesson.status = 'holding';
            if (lesson?.status === 'sold') lesson.status = 'done';
            this.callbacks.onSaveLesson?.();
            this.finishLesson();
            return;
        }
        if (!this.isActive) return;
        this.isActive = false;
        this.callbacks.onTutorialChartVisibility?.(false);
        this.chartTourVisible = false;
        this.overlay?.classList.remove('vn-chart-tour');
        this.callbacks.onActivityChanged?.();
        this.stopRecommendationReview();
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.cleanupHighlights();
        this.overlay?.classList.add('hidden');

        if (this.callbacks.onComplete) {
            this.callbacks.onComplete({ skipped: isSkipped });
        }
        if (isSkipped) {
            const lesson = this.callbacks.getFirstTradeLesson?.();
            if (lesson) lesson.status = 'done';
            this.callbacks.onSaveLesson?.();
        } else this.tryShowLesson();
    }

    notifyMarketUpdated(state) {
        this.marketState = state;
        if (this.lessonResume && this.callbacks.getFirstTradeLesson?.()?.status === 'sold'
            && this.steps[this.currentStepIdx]?.id !== 'first_sale_result') {
            this.finishLesson();
            this.tryShowLesson();
        } else if (!this.isActive) this.tryShowLesson();
    }

    tryShowLesson() {
        if (this.lessonEnabled === false) return false;
        const lesson = this.callbacks.getFirstTradeLesson?.();
        if (!lesson || this.lessonResume || !['ready', 'sold', 'selling'].includes(lesson.status)) return false;
        const state = this.marketState || this.callbacks.getMarketState?.();
        const stock = state?.stocks.find(s => s.id === lesson.stockId);
        if (!stock) return false;
        if (lesson.status !== 'sold' && !state.portfolio.some(p => p.id === stock.id && !p.isShort && p.qty > 0)) return false;
        this.lessonResume = { steps: this.steps, index: this.currentStepIdx, active: this.isActive };
        const base = { speaker: '전담 매니저 안나', expression: 'Smile', tracker: '첫 투자 • 매도와 보유 선택' };
        const sellGuide = {
            ...base, id: 'first_sell_guide', allowHold: true, requiresManualAction: true,
            text: '수량과 예상 손익을 확인한 뒤 [매도 (SELL)]를 누르세요. 계속 보유해도 괜찮아요.',
            cards: [['매도', '지금 거래 시도'], ['계속 보유', '나중에 직접 매도']],
            interactionHint: '매도 수량과 예상 손익을 확인한 뒤 직접 매도하거나, 계속 보유하기를 선택하세요.',
            targetSelector: '#btnSellExecute', actionBtnText: '매도 화면 다시 열기',
            onEnter: () => { this.callbacks.onOpenSellGuide?.(stock.id); this.highlightElement('#btnSellExecute', true); },
            onAction: () => this.callbacks.onOpenSellGuide?.(stock.id)
        };
        if (lesson.status === 'sold') {
            const sale = lesson.sale;
            this.steps = [{ ...base, id: 'first_sale_result', expression: 'Happy',
                text: `${sale.quantity}주를 매도했어요! 실현 손익은 ${sale.profit >= 0 ? '+' : ''}${sale.profit.toLocaleString()}G예요.`,
                cards: [['첫 매수가', lesson.buyPrice.toLocaleString() + 'G'], ['매도 체결가', sale.sellPrice.toLocaleString() + 'G'], ['돌아온 현금', sale.proceeds.toLocaleString() + 'G']],
                actionBtnText: '확인', onAction: () => this.complete() }];
        } else if (lesson.status === 'selling') this.steps = [sellGuide];
        else this.steps = [{ ...base, id: 'first_profit_choice', allowHold: true, requiresManualAction: true,
            text: `'${stock.name}'이 10% 이상 올랐어요! 지금 팔까요, 계속 보유할까요?`,
            cards: [['지금 매도', '손익을 확정'], ['계속 보유', '가격은 계속 변동']],
            detailText: '어느 쪽을 골라도 안내와 정착 지원금은 그대로예요. 나중에 매도하면 그때 결과를 안내해요.',
            actionBtnText: '매도해 보기',
            onAction: () => { lesson.status = 'selling'; this.callbacks.onSaveLesson?.(); this.steps = [sellGuide]; this.currentStepIdx = 0; this.showCurrentStep(); }
        }];
        this.currentStepIdx = 0;
        this.isActive = true;
        this.overlay?.classList.remove('hidden');
        this.showCurrentStep();
        return true;
    }

    finishLesson() {
        const resume = this.lessonResume;
        this.lessonResume = null;
        this.finishTyping();
        this.cleanupHighlights();
        this.steps = resume.steps;
        this.currentStepIdx = resume.index;
        this.isActive = resume.active;
        this.callbacks.onActivityChanged?.();
        if (this.isActive) this.showCurrentStep();
        else this.overlay?.classList.add('hidden');
    }

    cleanupHighlights() {
        clearAnnaTradeFocus();
        this.overlay?.classList.remove('vn-phone-focus', 'vn-app-focus', 'vn-app-tour', 'vn-hts-focus', 'vn-stock-focus');
        document.querySelectorAll('.hts-tour-target').forEach(target => target.classList.remove('hts-tour-target'));
        document.querySelectorAll('.tutorial-pulse-target').forEach(el => {
            el.classList.remove('tutorial-pulse-target');
        });
    }
}
