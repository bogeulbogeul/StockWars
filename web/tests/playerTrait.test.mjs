import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPlayerTrait } from '../js/engine/PlayerTrait.js';
import { PersonalityTestStep } from '../js/components/character/PersonalityTestStep.js';
import { ItemEngine } from '../js/engine/ItemEngine.js';
import { LevelUpNotice } from '../js/components/LevelUpNotice.js';

test('aggressive test result includes stat key; legacy saves are repaired once', () => {
    let trait;
    const step = new PersonalityTestStep({}, { onEvaluated: result => { trait = result; } });
    step.scores.management = 3;
    step.evaluate();
    assert.equal(trait.key, 'management');
    const engine = new ItemEngine();
    const profile = { trait: { title: '공격적 자산가' } };
    applyPlayerTrait(engine.state, profile);
    assert.equal(engine.stats().management, 1);
    assert.equal(profile.trait.key, 'management');
    applyPlayerTrait(engine.state, profile);
    assert.equal(engine.stats().management, 1);
    const restored = new ItemEngine({ state: JSON.parse(JSON.stringify(engine.state)) });
    applyPlayerTrait(restored.state, profile);
    assert.equal(restored.stats().management, 1);
    const previouslyCorrect = new ItemEngine();
    previouslyCorrect.state.baseStats.management = 2;
    applyPlayerTrait(previouslyCorrect.state, { trait });
    assert.equal(previouslyCorrect.stats().management, 2);
});

test('level choice opens once with celebration and remains open until confirmation', () => {
    const notice = Object.create(LevelUpNotice.prototype);
    const labels = new Map();
    let shown = 0, sounds = 0;
    notice.getState = () => ({ level: 3, points: 2, stats: {} });
    notice.element = { open: false, querySelector(selector) {
        if (!labels.has(selector)) labels.set(selector, {});
        return labels.get(selector);
    }, querySelectorAll: () => [], close() { this.open = false; }, showModal() { this.open = true; shown++; } };
    notice.audio = { playWin() { sounds++; } };
    try {
        notice.show();
        notice.show();
        assert.equal(labels.get('.level-up-number').textContent, 'Lv. 3');
        assert.match(labels.get('.level-up-points').textContent, /남은 포인트 2/);
        assert.equal(notice.element.open, true);
        assert.equal(shown, 1);
        assert.equal(sounds, 1);
    } finally { notice.close(); }
});
