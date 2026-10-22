import { annaLessonScreen } from '../tutorial/annaLessonScreen.js';
import { applyAnnaTradeFocus } from '../tutorial/annaTradeFocus.js';
import { tutorialShortcutDestination } from '../tutorial/tutorialPresentation.js';
import { renderAnnaLesson } from '../tutorial/compactAnnaLessons.js';
import { tutorialCheckpoint } from '../tutorial/tutorialCheckpoint.js';
import { applyDialogueTheme } from '../dialogue/dialogueTheme.js';

export const AnnaTutorialMethods1 = {
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
    },

    renderDialogue(step, reviewing = false) {
        applyDialogueTheme(this.dialogueBox, step.speaker || 'moa');
        if (reviewing || this.reviewingScreen || ['portfolio_guide', 'news_tab_guide', 'hts_home_overview', 'movement_keys_guide'].includes(step.id)) {
            this.restoringScreen = true;
            try {
                this.callbacks.onRestoreLessonScreen?.(annaLessonScreen(step, this.steps), this.targetStock?.id);
            } finally { this.restoringScreen = false; }
        }
        this.callbacks.onTutorialTradeStep?.(step.id);
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
        this.overlay?.classList.toggle('vn-inventory-focus', step.id === 'rumor_inventory_guide');
        this.overlay?.classList.toggle('vn-rumor-focus', !!step.actualRumor);
        this.overlay?.classList.toggle('vn-hud-focus', step.id.startsWith('hud_'));
        if (step.actualRumor && step.rumorPreview) this.callbacks.onRumorPreview?.(step.rumorPreview);
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
        this.overlay?.classList.toggle('vn-movement-guide', ['go_town_proposal'].includes(step.id));
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
        if (step.choices) {
            const choices = document.createElement('div');
            choices.className = 'vn-rumor-choices';
            for (const choice of step.choices) {
                const button = document.createElement('button');
                button.className = 'vn-btn';
                button.textContent = choice.label;
                button.addEventListener('click', event => {
                    event?.stopPropagation();
                    if (reviewing) {
                        if (!this.isActive || this.dialogueHistory[this.historyCursor]?.id !== step.id) return;
                        const feedback = this.dialogueHistory[this.historyCursor + 1];
                        if (!feedback) return;
                        feedback.baseText ??= feedback.text;
                        feedback.text = choice.feedback;
                        feedback.detailText = feedback.baseText;
                        const liveFeedback = this.steps.find(entry => entry.id === feedback.id);
                        if (liveFeedback) {
                            liveFeedback.text = choice.feedback;
                            liveFeedback.detailText = feedback.baseText;
                        }
                        this.advanceHistory();
                        return;
                    }
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
        if (this.speakerName) this.speakerName.textContent = step.speaker?.includes('모아') ? '모아' : step.speaker;
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
        if (this.btnNext) this.btnNext.disabled = step.id === 'put_phone_away' || (reviewing
            ? ['#btnSubtabInfo', '#btnSubtabOrder', '#btnSubtabChart', '#btnCloseInventory', '#btnOpenOrder', '#iconStockApp', '#btnCloseTradeModal', '#btnCloseDetailedChartModal', '.nav-tab[data-tab="Profile"]', '.nav-tab[data-tab="News"]', '.nav-tab[data-tab="Market"]'].includes(step.targetSelector)
            : !!step.requiresManualAction);
        if (this.btnPrevious) this.btnPrevious.disabled = (this.historyCursor ?? this.dialogueHistory.length - 1) <= 0;
        this.typeText(presentationText || step.text);
    },

    showPreviousDialogue() {
        if (!this.isActive) return;
        const cursor = this.historyCursor ?? this.dialogueHistory.length - 1;
        if (cursor <= 0) return;
        this.historyCursor = cursor - 1;
        this.renderDialogue(this.dialogueHistory[this.historyCursor], true);
    },


    setExpression(expression = 'Standard') {
        const labels = { Standard: '기본', Smile: '미소', Happy: '기쁨', Pain: '걱정', Angry: '분노' };
        const resolved = Object.hasOwn(labels, expression) ? expression : 'Standard';
        if (this.portrait) {
            this.portrait.dataset.expression = resolved;
            this.portrait.setAttribute('aria-label', `모아 — ${labels[resolved]} 표정`);
        }
    },

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
    },

    finishTyping() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.isTyping = false;
        if (this.dialogueText) this.dialogueText.textContent = this.currentText;
        if (this.nextIndicator) this.nextIndicator.style.opacity = '1';
    },

    advanceHistory() {
        this.historyCursor++;
        if (this.historyCursor >= this.dialogueHistory.length - 1) {
            this.historyCursor = null;
            this.renderDialogue(this.steps[this.currentStepIdx]);
        } else this.renderDialogue(this.dialogueHistory[this.historyCursor], true);
    },


};
