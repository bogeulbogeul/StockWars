import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnnaScenario } from '../js/components/tutorial/annaTutorialScenario.js';
import { AnnaTutorial } from '../js/components/AnnaTutorial.js';

test('logistics lesson compares one event in five stages before graduation', () => {
    const steps = buildAnnaScenario({});
    const index = id => steps.findIndex(step => step.id === id);
    assert.ok(index('rumor_inventory_guide') < index('rumor_time_prediction'));
    assert.ok(index('rumor_reading_summary') < index('logistics_completed'));
    const examples = steps.filter(step => step.id.startsWith('rumor_analysis_example_'));
    assert.equal(examples.length, 5);
    for (const example of examples) {
        assert.match(example.text, /연습용/);
        assert.match(example.text, /이틀 뒤/);
        assert.equal(example.requiresManualAction, false);
    }
    for (const example of examples.slice(0, 3)) assert.doesNotMatch(example.text, /에코 배터리|5조 원/);
    assert.match(examples[4].text, /5조 원/);
});

test('answers advance once; reviewing changes feedback without advancing the live lesson', () => {
    const previousDocument = globalThis.document;
    const element = () => ({ style: {}, children: [], classList: { toggle() {}, add() {}, remove() {} },
        append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } },
        remove() { this.parent.children = this.parent.children.filter(child => child !== this); },
        querySelector(selector) { return this.children.find(child => child.className === selector.slice(1)); },
        addEventListener(type, listener) { this[type] = listener; } });
    globalThis.document = { createElement: element, querySelectorAll: () => [], querySelector: () => null };
    try {
        for (let answer = 0; answer < 3; answer++) {
            const steps = buildAnnaScenario({});
            const currentStepIdx = steps.findIndex(step => step.id === 'rumor_time_prediction');
            const body = element();
            let advances = 0;
            const tutorial = Object.assign(Object.create(AnnaTutorial.prototype), {
                callbacks: {}, steps, currentStepIdx, isActive: true, historyCursor: null, dialogueHistory: [],
                dialogueBox: { classList: element().classList, querySelector: selector => selector === '.vn-dialogue-body' ? body : body.querySelector(selector) },
                setExpression() {}, typeText() {}, nextStep() { advances++; this.currentStepIdx++; }
            });
            const step = steps[currentStepIdx];
            tutorial.renderDialogue(step);
            const button = body.querySelector('.vn-rumor-choices').children[answer];
            button.click(); button.click();
            assert.equal(advances, 1);
            assert.ok(steps[currentStepIdx + 1].text.startsWith(step.choices[answer].feedback));
            tutorial.renderDialogue(step, true);
            assert.equal(body.children.filter(child => child.className === 'vn-lesson-visual').length, 1);
            const reviewButtons = body.querySelector('.vn-rumor-choices').children;
            assert.equal(reviewButtons.length, 3);
            tutorial.dialogueHistory = [step, { ...steps[currentStepIdx + 1] }];
            tutorial.historyCursor = 0;
            let historyAdvances = 0;
            tutorial.advanceHistory = () => { historyAdvances++; tutorial.historyCursor++; };
            const liveIndex = tutorial.currentStepIdx;
            reviewButtons[(answer + 1) % 3].click();
            reviewButtons[(answer + 1) % 3].click();
            assert.equal(historyAdvances, 1);
            assert.equal(advances, 1);
            assert.equal(tutorial.currentStepIdx, liveIndex);
            assert.equal(tutorial.dialogueHistory[1].text, step.choices[(answer + 1) % 3].feedback);
        }
    } finally { globalThis.document = previousDocument; }
});
