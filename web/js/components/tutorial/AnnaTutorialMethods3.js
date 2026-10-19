import { clearAnnaTradeFocus } from '../tutorial/annaTradeFocus.js';
import { tutorialCheckpoint, nextTutorialChapter } from '../tutorial/tutorialCheckpoint.js';

export const AnnaTutorialMethods3 = {
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
    },

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
    },

    notifyMarketUpdated(state) {
        this.marketState = state;
        if (this.lessonResume && this.callbacks.getFirstTradeLesson?.()?.status === 'sold'
            && this.steps[this.currentStepIdx]?.id !== 'first_sale_result') {
            this.finishLesson();
            this.tryShowLesson();
        } else if (!this.isActive) this.tryShowLesson();
    },

    tryShowLesson() {
        // The first-trade follow-up must never interrupt the onboarding dialogue.
        if (this.isActive) return false;
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
    },

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
    },

    cleanupHighlights() {
        clearAnnaTradeFocus();
        this.overlay?.classList.remove('vn-phone-focus', 'vn-app-focus', 'vn-app-tour', 'vn-hts-focus', 'vn-stock-focus');
        document.querySelectorAll('.hts-tour-target').forEach(target => target.classList.remove('hts-tour-target'));
        document.querySelectorAll('.tutorial-pulse-target').forEach(el => {
            el.classList.remove('tutorial-pulse-target');
        });
    },
};
