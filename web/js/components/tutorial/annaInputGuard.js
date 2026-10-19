// Capture user input before the game shortcuts and scene handlers receive it.
export function installAnnaInputGuard(tutorial, host = window) {
    const block = event => { event.preventDefault(); event.stopImmediatePropagation(); };
    const guard = event => {
        if (!tutorial.isActive || tutorial.overlay?.classList.contains('hidden') || event.isTrusted === false) return;
        const reviewing = tutorial.historyCursor != null;
        const visibleStep = reviewing ? tutorial.dialogueHistory?.[tutorial.historyCursor] : tutorial.steps[tutorial.currentStepIdx];
        const step = reviewing ? null : visibleStep;
        const movement = step?.requiresManualAction && ['go_town_proposal'].includes(step.id);
        if (event.type === 'keydown' || event.type === 'keypress') {
            if (visibleStep?.id === 'movement_keys_guide' && event.type === 'keydown' && ['w', 'a', 's', 'd'].includes(tutorial.inputKey(event))) return;
            // Release events still reach held-key trackers; only movement practice permits new keys.
            if (movement && event.type === 'keydown' && ['w', 'a', 's', 'd', 'f', 'shift'].includes(tutorial.inputKey(event))) return;
            block(event);
            return;
        }
        if (tutorial.dialogueBox?.contains(event.target)) return;
        if (visibleStep?.id === 'put_phone_away') {
            block(event);
            if (event.type === 'click' && !event.target?.closest?.('.phone-shell, .modal-overlay, .main-hud-bar, .demo-top-bar, button, a, input, select, textarea')) {
                tutorial.callbacks.onPutPhoneAway?.();
                if (reviewing) tutorial.advanceHistory();
                else tutorial.nextStep();
            }
            return;
        }
        if (event.target?.closest?.('#tradeModal .anna-trade-target details > summary')) return;
        // Chart exploration is safe during both the current lesson and replay.
        // Trading and other world actions remain locked when reviewing history.
        if (visibleStep?.allowedSelector && event.target?.closest?.(visibleStep.allowedSelector)) return;
        if (reviewing && ['#btnSubtabInfo', '#btnSubtabOrder', '#btnSubtabChart', '#btnCloseInventory', '#btnOpenOrder', '#iconStockApp', '#btnCloseTradeModal', '#btnCloseDetailedChartModal', '.nav-tab[data-tab="Profile"]', '.nav-tab[data-tab="News"]', '.nav-tab[data-tab="Market"]'].includes(visibleStep?.targetSelector)
            && event.target?.closest?.(visibleStep.targetSelector)) return;
        if (step?.requiresManualAction) {
            const selectors = [step.targetSelector];
            if (step.id === 'go_town_proposal') selectors.push('[data-home-place="exit"]', '#isoDoorPrompt', '#serverSelectModal:not(.hidden)');
            if (selectors.filter(Boolean).some(selector => event.target?.closest?.(selector))) return;
        }
        block(event);
    };
    const events = ['keydown', 'keypress', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchend', 'wheel'];
    for (const type of events) host.addEventListener(type, guard, { capture: true, passive: false });
    return () => { for (const type of events) host.removeEventListener(type, guard, true); };
}
