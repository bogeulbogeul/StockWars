import { AnnaTutorialMethods1 } from './tutorial/AnnaTutorialMethods1.js';
import { AnnaTutorialMethods2 } from './tutorial/AnnaTutorialMethods2.js';
import { AnnaTutorialMethods3 } from './tutorial/AnnaTutorialMethods3.js';
import { annaLessonScreen } from './tutorial/annaLessonScreen.js';
import { buildRumorQuiz } from './tutorial/rumorQuiz.js';
import { rumorDecryption } from './inventory/RumorPopup.js';
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
            if (checkpoint === 'go_town_proposal') checkpoint = 'movement_keys_guide';
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


}
Object.assign(AnnaTutorial.prototype, AnnaTutorialMethods1, AnnaTutorialMethods2, AnnaTutorialMethods3);
