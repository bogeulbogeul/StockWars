import { buildRumorQuiz } from '../tutorial/rumorQuiz.js';
import { rumorDecryption } from '../inventory/RumorPopup.js';
import { tutorialShortcutDestination } from '../tutorial/tutorialPresentation.js';

export const AnnaTutorialMethods2 = {
    handleAdvance() {
        const visibleStep = this.historyCursor != null ? this.dialogueHistory[this.historyCursor] : this.steps[this.currentStepIdx];
        if (visibleStep?.id === 'put_phone_away') {
            if (this.isTyping) this.finishTyping();
            return;
        }
        if (this.isTyping) {
            this.finishTyping();
            return;
        }

        if (this.historyCursor !== null && this.historyCursor !== undefined) {
            const step = this.dialogueHistory[this.historyCursor];
            if (['#btnSubtabInfo', '#btnSubtabOrder', '#btnSubtabChart', '#btnCloseInventory', '#btnOpenOrder', '#iconStockApp', '#btnCloseTradeModal', '#btnCloseDetailedChartModal', '.nav-tab[data-tab="Profile"]', '.nav-tab[data-tab="News"]', '.nav-tab[data-tab="Market"]'].includes(step?.targetSelector)) return;
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
    },

    handleActionClick() {
        if (this.historyCursor != null) return;
        const step = this.steps[this.currentStepIdx];
        if (step && step.onAction) {
            step.onAction(this);
        } else {
            this.nextStep();
        }
    },

    nextStep() {
        this.currentStepIdx++;
        if (!this.lessonResume && this.tryShowLesson()) return;
        if (this.currentStepIdx < this.steps.length) {
            this.showCurrentStep();
        } else {
            this.complete();
        }
    },

    // Called when player buys first stock during tutorial
    notifyStockPurchased(stockId) {
        if (!this.isActive || stockId !== this.targetStock?.id) return;
        this.firstPurchaseDone = true;
        this.stopRecommendationReview();
        this.highlightElement('#btnBuyExecute', false);
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && (['buy_stock', 'select_stock', 'chart_colors', 'chart_detail', 'market_order_guide', 'limit_order_guide', 'open_company_info', 'open_order_screen', 'order_screen_overview', 'stock_basics_profit', 'stock_profit_example', 'stock_profit_fees'].includes(currentStep.id) || currentStep.id.startsWith('company_info_'))) {
            const celebIdx = this.steps.findIndex(s => s.id === 'celebrate');
            if (celebIdx !== -1) {
                this.currentStepIdx = celebIdx;
                this.showCurrentStep();
            } else {
                this.nextStep();
            }
        }
    },

    // Called when player manually clicks smartphone toggle button
    notifyOrderScreenOpened() {
        if (!this.isActive || this.restoringScreen) return;
        if (this.historyCursor != null) {
            if (this.dialogueHistory[this.historyCursor]?.id === 'open_order_screen') this.advanceHistory();
            return;
        }
        if (this.steps[this.currentStepIdx]?.id === 'open_order_screen') this.nextStep();
    },

    notifyDetailedChart(open) {
        if (!open && this.isActive && !this.restoringScreen && this.historyCursor != null
            && this.dialogueHistory[this.historyCursor]?.targetSelector === '#btnCloseDetailedChartModal') {
            this.advanceHistory();
            return;
        }
        if (!this.isActive || this.restoringScreen || this.historyCursor !== null) return;
        const id = this.steps[this.currentStepIdx]?.id;
        if ((open && id === 'chart_detail') || (!open && id === 'chart_tour_close')) this.nextStep();
    },

    notifyPhoneOpened() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'open_phone') {
            this.highlightElement('#floatingPhoneBtn', false);
            this.highlightElement('#btnToggleFrame', false);
            this.nextStep();
        }
    },

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
    },

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
    },

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
    },

    // Called when player manually opens trade modal for recommended stock
    notifyTradeModalOpened(stockId) {
        if (!this.isActive) return;
        const targetId = this.targetStock?.id || 'CLOUDBERRY';
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'select_stock' && (stockId === targetId || !stockId)) {
            this.highlightStock(targetId, false);
            this.nextStep();
        }
    },

    // Called when player enters public town from office
    explainOpenedRumor(item, decoded) {
        if (!this.isActive || this.historyCursor != null || this.steps[this.currentStepIdx]?.id !== 'rumor_intel_explain') return;
        const end = this.steps.findIndex(step => step.id === 'close_inventory_guide');
        if (end < 0) return;
        const base = { speaker: '모아', expression: 'Smile', tracker: '3/4 • 실제 찌라시와 분석력', requiresManualAction: false, actualRumor: true };
        const previews = [1, 2, 3, 4, 5].map(level => rumorDecryption(item.intelReport || item.desc || '', { ...item, interpretationLevel: 1 }, level));
        const lessons = [
            { ...base, id: 'rumor_actual_level', rumorPreview: previews[0], text: '먼저 분석력 1단계에서는 이 찌라시가 어떻게 보이는지 살펴볼게요.' },
            { ...base, id: 'rumor_actual_clues', text: '이 글에서 기업을 가리키는 표현, 어떤 사건인지, 언제 영향을 줄지를 찾아보세요. 낮은 단계에서는 기업명이 비유로 가려질 수 있어요.', example: { label: '분석력에 따른 차이', rows: ['업종과 흐름 → 사건과 방향 → 기업과 근거 → 상세 정보', '분석력과 이 찌라시에 유지된 해석 단계 중 높은 단계가 적용돼요.'] } },
            { ...base, id: 'rumor_actual_quiz', rumorPreview: previews[0], requiresManualAction: true,
                ...buildRumorQuiz(previews[0].text) },
            { ...base, id: 'rumor_actual_feedback', text: '비유는 추리의 단서이며 사실의 보증은 아니에요. 이제 같은 찌라시의 분석력별 차이를 볼게요.' },
            ...previews.slice(1).map(preview => ({ ...base, id: `rumor_actual_compare_${preview.level}`, rumorPreview: preview,
                text: `같은 찌라시를 분석력 ${preview.level}단계로 읽은 모습이에요. 앞 단계에서 가려졌던 정보가 어떻게 구체적으로 드러나는지 비교해 보세요.`,
                example: { label: '앞 단계와 비교하기', rows: ['새롭게 드러난 기업·사건·시간 단서를 찾아보세요.'] } })),
            { ...base, id: 'rumor_actual_close', rumorPreview: { ...decoded, actual: true }, text: '실제 분석력으로 돌아왔어요. 자세히 읽혀도 진위를 보장하지는 않아요. 뉴스·공시와 비교하세요. 이제 [열람 확인 완료]를 눌러 주세요.', requiresManualAction: true, targetSelector: '#btnRumorConfirm, #btnRumorClose', example: { label: '직접 확인하기', rows: ['찌라시 창을 닫으면 다음 안내가 이어져요.'] } }
        ];
        this.steps.splice(this.currentStepIdx + 1, end - this.currentStepIdx - 1, ...lessons);
        this.nextStep();
    },


    notifyServerSelectOpened() {
        if (!this.isActive || this.historyCursor != null) return;
        if (this.steps[this.currentStepIdx]?.id === 'go_town_proposal') this.nextStep();
    },

    notifyTownEntered() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && (currentStep.id === 'go_town_proposal' || currentStep.id === 'server_enter')) {
            this.cleanupHighlights();
            this.nextStep();
        }
    },



    // Called when player opens inventory modal
    notifyInventoryOpened() {
        if (!this.isActive) return;
        const currentStep = this.steps[this.currentStepIdx];
        if (currentStep && currentStep.id === 'rumor_inventory_guide') {
            this.highlightElement('#btnHudInventory', false);
            this.nextStep();
        }
    },

    highlightElement(selector, enable) {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.toggle('tutorial-pulse-target', enable);
        }
    },

    highlightStock(stockId, enable) {
        const row = document.querySelector(`.stock-item-row[data-id="${stockId}"]`);
        if (row) {
            row.classList.toggle('tutorial-pulse-target', enable);
        }
    },


};
