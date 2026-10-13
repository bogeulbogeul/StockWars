import test from 'node:test';
import assert from 'node:assert/strict';
import { CipherTour, cipherTourSteps, CIPHER_TOUR_KEY } from '../js/components/tutorial/cipherTour.js';

function element() {
    const node = { children: [], dataset: {}, listeners: {}, open: false,
        classList: { add() {}, remove() {} },
        append(...children) { this.children.push(...children); },
        prepend(child) { this.children.unshift(child); },
        setAttribute() {}, remove() {}, focus() {}, scrollIntoView() {},
        contains(target) { return target === this || this.children.some(child => child.contains?.(target)); },
        querySelector() { return element(); },
        addEventListener(name, callback) { this.listeners[name] = callback; },
        removeEventListener(name, callback) { if (this.listeners[name] === callback) delete this.listeners[name]; }
    };
    Object.defineProperty(node, 'lastElementChild', { get: () => node.children.at(-1) });
    return node;
}

test('tour enters actual rooms in order, blocks unintended actions, and starts K practice only on final action', () => {
    const original = { document: globalThis.document, localStorage: globalThis.localStorage, cancelAnimationFrame: globalThis.cancelAnimationFrame };
    const saved = new Map(), transitions = [];
    globalThis.document = { createElement: element, getElementById: () => true, head: element() };
    globalThis.localStorage = { setItem: (key, value) => saved.set(key, value) };
    globalThis.cancelAnimationFrame = () => {};
    const room = name => ({ dialog: element(), open(options) { this.dialog.open = true; transitions.push([name, options]); }, close() { this.dialog.open = false; }, renderAccount() {} });
    const lobby = { dialog: element(), canvas: element(), notice: element(), player: { stop() {} }, trainingRoom: room('training'), competitionRoom: room('competition') };
    let practice = 0;
    lobby.competitionRoom.startTutorial = () => practice++;
    const tour = new CipherTour(lobby);
    try {
        tour.start();
        assert.equal(tour.host, lobby.dialog);
        let blocked = false;
        tour.block({ target: element(), preventDefault() { blocked = true; }, stopImmediatePropagation() {} });
        assert.equal(blocked, true);
        let enteredTraining = false, enteredCompetition = false;
        for (let i = 1; i < cipherTourSteps.length; i++) {
            tour.move(1);
            const step = cipherTourSteps[i];
            if (step.room === 'training') { enteredTraining = true; assert.equal(lobby.trainingRoom.dialog.open, true); }
            if (step.room === 'competition') { enteredCompetition = true; assert.equal(lobby.competitionRoom.dialog.open, true); }
            assert.equal(practice, 0);
        }
        assert.equal(enteredTraining && enteredCompetition, true);
        assert.deepEqual(transitions.at(-1), ['competition', { skipTutorial: true }]);
        assert.equal(saved.has(CIPHER_TOUR_KEY), false);
        tour.move(1);
        assert.equal(practice, 1);
        assert.equal(tour.active, false);
        assert.equal(saved.get(CIPHER_TOUR_KEY), '1');
        tour.move(1);
        assert.equal(practice, 1);
        tour.start();
        for (let i = 0; i < 4; i++) tour.move(1);
        tour.move(-1);
        assert.equal(tour.host, lobby.dialog);
        assert.equal(lobby.trainingRoom.dialog.open, false);
        tour.move(1);
        tour.stop();
        assert.equal(lobby.trainingRoom.dialog.open, false);
        assert.equal(practice, 1);
        assert.equal(Object.keys(tour.host.listeners).length, 0);
    } finally {
        for (const [key, value] of Object.entries(original)) {
            if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
        }
    }
});
