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

test('each time answer advances once with feedback and reviewing cannot answer again', () => {
    const previousDocument = globalThis.document;
    const element = () => ({ style: {}, children: [], classList: { toggle() {}, add() {}, remove() {} },
        append(child) { this.children.push(child); }, addEventListener(type, listener) { this[type] = listener; } });
    globalThis.document = { createElement: element };
    try {
        for (let answer = 0; answer < 3; answer++) {
            const steps = buildAnnaScenario({});
            const currentStepIdx = steps.findIndex(step => step.id === 'rumor_time_prediction');
            const body = element();
            let advances = 0;
            const tutorial = Object.assign(Object.create(AnnaTutorial.prototype), {
                steps, currentStepIdx, isActive: true, historyCursor: null, dialogueHistory: [],
                dialogueBox: { classList: element().classList, querySelector: selector => selector === '.vn-dialogue-body' ? body : null },
                setExpression() {}, typeText() {}, nextStep() { advances++; this.currentStepIdx++; }
            });
            const step = steps[currentStepIdx];
            tutorial.renderDialogue(step);
            const button = body.children[0].children[answer];
            button.click(); button.click();
            assert.equal(advances, 1);
            assert.ok(steps[currentStepIdx + 1].text.startsWith(step.choices[answer].feedback));
            tutorial.renderDialogue(step, true);
            assert.equal(body.children.length, 1);
        }
    } finally { globalThis.document = previousDocument; }
});
