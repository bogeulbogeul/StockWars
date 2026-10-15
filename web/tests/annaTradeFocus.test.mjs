import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnnaTradeFocus, clearAnnaTradeFocus } from '../js/components/tutorial/annaTradeFocus.js';

function element(children = []) {
    const classes = new Set();
    return { children, classes,
        classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
        contains(target) { return this === target || children.some(child => child.contains(target)); }
    };
}

test('expanded chart lessons target the chart modal and restore faded branches between steps', () => {
    const price = element(), metrics = element(), graph = element(), periods = element();
    const summary = element([price, metrics]), root = element([summary, graph, periods]);
    const all = [summary, price, metrics, graph, periods];
    const selectors = { '.detail-price-box': price, '.detail-metrics-grid': metrics, '#detailedChartScrollWrapper': graph, '#timeframeSelector': periods };
    root.querySelectorAll = selector => selectors[selector] ? [selectors[selector]] : [];
    const original = globalThis.document;
    globalThis.document = {
        querySelector(selector) { assert.equal(selector, '#detailedChartModal'); return root; },
        querySelectorAll() { return all.filter(node => node.classes.size); }
    };
    try {
        for (const [selector, target] of Object.entries(selectors)) {
            applyAnnaTradeFocus('chart_tour_test', undefined, selector);
            assert.ok(target.classes.has('anna-trade-target'));
            assert.ok(!target.classes.has('anna-trade-dim'));
            if (summary.contains(target)) assert.equal(summary.classes.size, 0);
            else assert.ok(summary.classes.has('anna-trade-dim'));
            assert.equal(all.filter(node => node.classes.has('anna-trade-target')).length, 1);
        }
        clearAnnaTradeFocus();
        assert.ok(all.every(node => node.classes.size === 0));
    } finally { globalThis.document = original; }
});


test('account capacity highlights slots and holdings while other regions fade, including empty holdings', () => {
    const slots = element(), holdings = element(), profile = element(), history = element(), header = element();
    slots.closest = () => null;
    const view = element([profile, slots, holdings, history]), root = element([header, view]);
    const all = [header, view, profile, slots, holdings, history];
    root.querySelectorAll = selector => selector === '#portfolioSlotStatus, #portfolioListContainer' ? [slots, holdings] : [];
    const original = globalThis.document;
    globalThis.document = {
        querySelector(selector) { assert.equal(selector, '#stockApp'); return root; },
        querySelectorAll() { return all.filter(node => node.classes.size); }
    };
    try {
        applyAnnaTradeFocus('portfolio_slots_capacity');
        assert.ok(slots.classes.has('anna-trade-target'));
        assert.ok(holdings.classes.has('anna-trade-target'));
        assert.ok([header, profile, history].every(node => node.classes.has('anna-trade-dim')));
        assert.equal(view.classes.size, 0);
        clearAnnaTradeFocus();
        assert.ok(all.every(node => node.classes.size === 0));
    } finally { globalThis.document = original; }
});
