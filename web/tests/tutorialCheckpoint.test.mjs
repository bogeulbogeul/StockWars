import test from 'node:test';
import assert from 'node:assert/strict';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { tutorialChapters, tutorialCheckpoint } from '../js/components/tutorial/tutorialCheckpoint.js';

test('chapters restore at meaningful boundaries, including logistics rewards and recovery', () => {
    const steps = buildAnnaScenario({});
    for (const [id] of tutorialChapters) {
        assert.equal(tutorialCheckpoint(steps, steps.findIndex(s => s.id === id)), id);
    }
    assert.equal(tutorialCheckpoint(steps, steps.findIndex(s => s.id === 'enter_logistics')), 'movement_keys_guide');
    assert.equal(tutorialCheckpoint(steps, steps.findIndex(s => s.id === 'rumor_analysis_example_4')), 'rumor_inventory_guide');
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
        tutorial.start({ nickname: '테스터' }, { stock: { id: 'TEST', name: '테스트' } }, 'rumor_inventory_guide');
        assert.equal(shown.id, 'tutorial_resume');
        assert.match(shown.text, /찌라시 읽는 방법.*다시 안내/);
        assert.equal(restored, undefined);
        assert.equal(granted, 0);
        tutorial.isTyping = false;
        tutorial.handleAdvance();
        assert.equal(shown.id, 'tutorial_resume');
        tutorial.handleActionClick();
        assert.equal(restored, 'rumor_inventory_guide');
        assert.equal(shown.id, 'rumor_inventory_guide');
        assert.equal(granted, 0);
        assert.equal(tutorial.firstPurchaseDone, true);
    } finally { tutorial.stopRecommendationReview(); }
});
