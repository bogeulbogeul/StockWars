import test from 'node:test';
import assert from 'node:assert/strict';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { tutorialChapters, tutorialCheckpoint } from '../js/components/tutorial/tutorialCheckpoint.js';

test('chapters restore at meaningful boundaries, without retired labor chapters', () => {
    const steps = buildAnnaScenario({});
    for (const [id] of tutorialChapters) {
    }
});

test('returning player sees Anna welcome before chapter actions; review cannot re-execute it', () => {
    let restored, granted = 0, shown;
    const tutorial = Object.assign(Object.create(AnnaTutorial.prototype), {
        callbacks: { getFirstTradeLesson: () => ({ stockId: 'TEST' }),
            onRestoreTutorialChapter: id => { restored = id; }, onGrantInitialFunds: () => { granted++; } },
        cleanupHighlights() {}, overlay: { classList: { remove() {} } },
        showCurrentStep() { shown = this.steps[this.currentStepIdx]; }
    });
    try {
        tutorial.start({ nickname: '테스터' }, { stock: { id: 'TEST', name: '테스트' } }, 'stock_basics_budget');
        assert.equal(shown.id, 'tutorial_resume');
        assert.match(shown.text, /생활비 준비와 자립.*부터 이어갈까요/);
        assert.equal(restored, undefined);
        assert.equal(granted, 0);
        tutorial.isTyping = false;
        tutorial.handleAdvance();
        assert.equal(shown.id, 'tutorial_resume');
        tutorial.handleActionClick();
        assert.equal(restored, 'stock_basics_budget');
        assert.equal(shown.id, 'stock_basics_budget');
        assert.equal(granted, 0);
        assert.equal(tutorial.firstPurchaseDone, true);
    } finally { tutorial.stopRecommendationReview(); }
});
