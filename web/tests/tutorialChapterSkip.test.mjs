import { annaLessonScreen } from '../js/components/tutorial/annaLessonScreen.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialChapters, nextTutorialChapter } from '../js/components/tutorial/tutorialCheckpoint.js';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';

test('each chapter skips to the next boundary, with only the last ending the tutorial', () => {
    const steps = buildAnnaScenario({});
    for (let i = 0; i < tutorialChapters.length; i++) {
        const start = steps.findIndex(step => step.id === tutorialChapters[i][0]);
        const end = i + 1 < tutorialChapters.length ? steps.findIndex(step => step.id === tutorialChapters[i + 1][0]) : steps.length;
        for (let index = start; index < end; index++) {
            assert.equal(nextTutorialChapter(steps, index)?.id ?? null, tutorialChapters[i + 1]?.[0] ?? null);
        }
    }
    steps.unshift({ id: 'tutorial_resume' });
    assert.equal(nextTutorialChapter(steps, 0, 'celebrate').id, 'go_town_proposal');
});

test('skipping trading goes to account selection without completing or simulating a purchase', () => {
    const steps = buildAnnaScenario({});
    const calls = [];
    const tutorial = {
        isActive: true, steps, currentStepIdx: steps.findIndex(step => step.id === 'chart_detail'),
        userProfile: {}, historyCursor: 0, dialogueHistory: [{ id: 'welcome_1' }],
        overlay: { classList: { remove() {} } }, cleanupHighlights() {},
        callbacks: { onTutorialChartVisibility: value => calls.push(['chart', value]), onSkipTutorialChapter: id => calls.push(['skip', id]) },
        stopRecommendationReview() {}, showCurrentStep() { calls.push(['step', this.steps[this.currentStepIdx].id]); },
        complete() { assert.fail('A chapter skip must not complete the tutorial'); }
    };
    AnnaTutorial.prototype.skip.call(tutorial);
    assert.deepEqual(calls, [['chart', false], ['skip', 'celebrate'], ['step', 'portfolio_guide']]);
    assert.equal(tutorial.historyCursor, null);
    assert.equal(tutorial.dialogueHistory[0].id, 'welcome_1');
    assert.ok(tutorial.dialogueHistory.some(step => step.id === 'chart_tour_graph'));
    assert.equal(tutorial.dialogueHistory.at(-1).id, 'buy_stock');
    assert.equal(new Set(tutorial.dialogueHistory.map(step => step.id)).size, tutorial.dialogueHistory.length);
    tutorial.dialogueHistory.push({ ...steps[tutorial.currentStepIdx] });
    tutorial.renderDialogue = (step, reviewing) => {
        assert.equal(step.id, 'buy_stock');
        assert.equal(reviewing, true);
    };
    AnnaTutorial.prototype.showPreviousDialogue.call(tutorial);
    assert.equal(tutorial.steps[tutorial.currentStepIdx].id, 'portfolio_guide');
    assert.equal(tutorial.isActive, true);
});


test('history restores the screen described by the lesson after leaving the phone', () => {
    const steps = buildAnnaScenario({});
    const screen = id => annaLessonScreen(steps.find(step => step.id === id), steps);
    assert.deepEqual(screen('news_reading_guide'), { phone: 'Stock', tab: 'News' });
    assert.deepEqual(screen('portfolio_guide'), { phone: 'Stock', tab: 'Market' });
    assert.deepEqual(screen('select_stock'), { phone: 'Stock', tab: 'Market' });
    assert.deepEqual(screen('chart_tour_graph'), { phone: 'Stock', tab: 'Market', trade: true });
    assert.deepEqual(screen('launch_stock_app'), { phone: 'Home' });
    assert.deepEqual(screen('hts_home_overview'), { phone: 'Stock', tab: 'Home' });
    assert.deepEqual(screen('go_town_proposal'), { phone: null });
});

test('restoring historical tabs and closing historical modals never advances the live lesson', () => {
    const tutorial = { isActive: true, restoringScreen: true, historyCursor: null,
        nextStep() { assert.fail('restoration must not advance'); } };
    AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'Profile');
    AnnaTutorial.prototype.notifyTradeModalClosed.call(tutorial);
    AnnaTutorial.prototype.notifyDetailedChart.call(tutorial, false);
});


test('continue rebuilds lesson history without the resume greeting or advancing from restore callbacks', () => {
    const steps = buildAnnaScenario({});
    const tutorial = {
        steps, dialogueHistory: [{ id: 'tutorial_resume' }], historyCursor: null,
        callbacks: { onRestoreTutorialChapter(id) {
            assert.equal(id, 'celebrate');
            AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'Profile');
        } },
        isActive: true,
        showCurrentStep() { this.dialogueHistory.push({ ...steps[this.currentStepIdx] }); },
        nextStep() { assert.fail('Restoring the screen must not skip a lesson'); }
    };
    AnnaTutorial.prototype.resumeChapter.call(tutorial, 'celebrate', steps.findIndex(step => step.id === 'celebrate'));
    assert.equal(steps[tutorial.currentStepIdx].id, 'portfolio_guide');
    assert.ok(!tutorial.dialogueHistory.some(step => step.id === 'tutorial_resume'));
    const shown = [];
    tutorial.renderDialogue = step => shown.push(step.id);
    AnnaTutorial.prototype.showPreviousDialogue.call(tutorial);
    assert.equal(shown[0], 'celebrate');
    assert.equal(tutorial.restoringScreen, false);
});


test('reviewed close lesson only advances when its X is clicked', () => {
    const tutorial = { isActive: true, isTyping: false, restoringScreen: false, historyCursor: 0,
        currentStepIdx: 0, steps: [{ id: 'portfolio_guide' }],
        dialogueHistory: [{ id: 'celebrate', targetSelector: '#btnCloseTradeModal' }, { id: 'portfolio_guide' }],
        advanceHistory: AnnaTutorial.prototype.advanceHistory,
        renderDialogue(step) { assert.equal(step.id, 'portfolio_guide'); }
    };
    AnnaTutorial.prototype.handleAdvance.call(tutorial);
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyTradeModalClosed.call(tutorial);
    assert.equal(tutorial.historyCursor, null);
    assert.equal(tutorial.currentStepIdx, 0);
});


test('purchase confirmation is the only trade-close instruction before account navigation', () => {
    const steps = buildAnnaScenario({});
    const closes = steps.filter(step => step.targetSelector === '#btnCloseTradeModal');
    assert.deepEqual(closes.map(step => step.id), ['celebrate']);
    assert.equal(steps[steps.indexOf(closes[0]) + 1].id, 'portfolio_guide');
});


test('closing the purchase confirmation restores Market before the user selects their account', () => {
    const steps = buildAnnaScenario({});
    const tutorial = { isActive: true, restoringScreen: false, historyCursor: null, steps,
        currentStepIdx: steps.findIndex(step => step.id === 'celebrate'),
        showCurrentStep() {
            const step = this.steps[this.currentStepIdx];
            assert.equal(step.id, 'portfolio_guide');
            assert.deepEqual(annaLessonScreen(step, steps), { phone: 'Stock', tab: 'Market' });
            assert.equal(step.requiresManualAction, true);
            assert.equal(step.targetSelector, '.nav-tab[data-tab="Profile"]');
        }
    };
    AnnaTutorial.prototype.notifyTradeModalClosed.call(tutorial);
    assert.equal(steps[tutorial.currentStepIdx].id, 'portfolio_guide');
    assert.deepEqual(annaLessonScreen(steps.find(step => step.id === 'social_and_ranking_guide'), steps), { phone: 'Stock', tab: 'Profile' });
});


test('account navigation in history waits for the account tab instead of Next', () => {
    const tutorial = { isActive: true, isTyping: false, restoringScreen: false, historyCursor: 0,
        currentStepIdx: 0, steps: [{ id: 'social_and_ranking_guide' }],
        dialogueHistory: [{ id: 'portfolio_guide', targetSelector: '.nav-tab[data-tab="Profile"]' }, { id: 'social_and_ranking_guide' }],
        advanceHistory: AnnaTutorial.prototype.advanceHistory,
        renderDialogue(step) { assert.equal(step.id, 'social_and_ranking_guide'); }
    };
    AnnaTutorial.prototype.handleAdvance.call(tutorial);
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'Profile');
    assert.equal(tutorial.historyCursor, null);
});


test('news navigation waits for the News tab in history and restores the account screen first', () => {
    const steps = buildAnnaScenario({});
    const guide = steps.find(step => step.id === 'news_tab_guide');
    assert.deepEqual(annaLessonScreen(guide, steps), { phone: 'Stock', tab: 'Profile' });
    const tutorial = { isActive: true, isTyping: false, restoringScreen: false, historyCursor: 0,
        currentStepIdx: 0, steps: [{ id: 'news_reading_guide' }],
        dialogueHistory: [guide, { id: 'news_reading_guide' }],
        advanceHistory: AnnaTutorial.prototype.advanceHistory,
        renderDialogue(step) { assert.equal(step.id, 'news_reading_guide'); }
    };
    AnnaTutorial.prototype.handleAdvance.call(tutorial);
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'Profile');
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'News');
    assert.equal(tutorial.historyCursor, null);
});


test('stock app launch in history requires the app icon instead of Next', () => {
    const tutorial = { isActive: true, isTyping: false, restoringScreen: false, historyCursor: 0,
        currentStepIdx: 0, steps: [{ id: 'hts_home_overview' }],
        dialogueHistory: [{ id: 'launch_stock_app', targetSelector: '#iconStockApp' }, { id: 'hts_home_overview' }],
        advanceHistory: AnnaTutorial.prototype.advanceHistory,
        renderDialogue(step) { assert.equal(step.id, 'hts_home_overview'); }
    };
    AnnaTutorial.prototype.handleAdvance.call(tutorial);
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyStockAppOpened.call(tutorial);
    assert.equal(tutorial.historyCursor, null);
});


test('market tab replay waits for its highlighted tab instead of Next', () => {
    const tutorial = { isActive: true, isTyping: false, restoringScreen: false, historyCursor: 0,
        currentStepIdx: 0, steps: [{ id: 'stock_basics_ownership' }],
        dialogueHistory: [{ id: 'market_tab', targetSelector: '.nav-tab[data-tab="Market"]' }, { id: 'stock_basics_ownership' }],
        advanceHistory: AnnaTutorial.prototype.advanceHistory,
        renderDialogue(step) { assert.equal(step.id, 'stock_basics_ownership'); }
    };
    AnnaTutorial.prototype.handleAdvance.call(tutorial);
    assert.equal(tutorial.historyCursor, 0);
    AnnaTutorial.prototype.notifyTabSwitched.call(tutorial, 'Market');
    assert.equal(tutorial.historyCursor, null);
});
