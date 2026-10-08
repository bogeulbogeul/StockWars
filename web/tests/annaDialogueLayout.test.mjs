import test from 'node:test';
import assert from 'node:assert/strict';
import { installAnnaDialogueLayout } from '../js/components/tutorial/annaDialogueLayout.js';

test('Anna card stays beside phone and large modals below HUD at multiple uniform scales', () => {
    const saved = Object.fromEntries(['window', 'document', 'getComputedStyle', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, globalThis[k]]));
    try {
        globalThis.window = { addEventListener() {} };
        globalThis.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
        globalThis.MutationObserver = class { observe() {} };
        globalThis.requestAnimationFrame = cb => { cb(); return 1; };
        globalThis.cancelAnimationFrame = () => {};
        for (const scale of [.5, .75, 1, 1.5]) for (const panelWidth of [390, 520, 920]) {
            const props = {};
            const left = (1600 - panelWidth) / 2;
            const rect = (l, t, r, b) => ({ left: l * scale, top: t * scale, right: r * scale, bottom: b * scale, width: (r-l)*scale, height: (b-t)*scale });
            const element = r => ({ getBoundingClientRect: () => r, getClientRects: () => [r] });
            globalThis.document = { body: {}, addEventListener() {}, querySelectorAll: selector => selector.includes('main-hud') ? [element(rect(0, 0, 1600, 160))] : [element(rect(left, 180, left + panelWidth, 1000))] };
            const overlay = { offsetWidth: 1600, classList: { contains: () => false }, contains: () => false, getBoundingClientRect: () => rect(0, 0, 1600, 1080), style: { setProperty: (k, v) => props[k] = parseFloat(v) } };
            installAnnaDialogueLayout(overlay);
            assert.ok(32 + props['--anna-card-width'] <= left - 32);
            assert.ok(1080 - 32 - props['--anna-card-height'] >= 192);
            if (panelWidth === 390) assert.equal(props['--anna-card-width'], 500);
        }
    } finally { for (const [k,v] of Object.entries(saved)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; } }
});
