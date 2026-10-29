// A scene owns its own advance signal, so skipping cannot affect concurrent NPCs.
export function animationDialogue(app, { speaker = '소망이', text }) {
    const controller = new AbortController(); let completed = false, resolve;
    const promise = new Promise(done => { resolve = done; });
    const panel = app.view.panel, wasHidden = panel.hidden;
    const next = () => {
        if (completed) return;
        completed = true; controller.abort(); resolve();
    };
    app.view.line({ speaker, text }, next); panel.hidden = false;
    const click = event => { if (!event.target.closest('button,input,textarea,select,a')) next(); };
    const key = event => {
        if (!['Enter', 'Space', 'KeyF'].includes(event.code) || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.closest?.('input,textarea,select')) return;
        event.preventDefault(); event.stopImmediatePropagation(); next();
    };
    panel.addEventListener('click', click); window.addEventListener('keydown', key, true);
    return {
        signal: controller.signal, next, wait: () => promise,
        onAdvance(callback) {
            if (completed) callback(); else controller.signal.addEventListener('abort', callback, { once: true });
        },
        dispose() {
            panel.removeEventListener('click', click); window.removeEventListener('keydown', key, true);
            panel.hidden = wasHidden;
        }
    };
}

export async function waitForAnimationLine(app, options) {
    const advance = animationDialogue(app, options);
    try { await advance.wait(); } finally { advance.dispose(); }
}

export function waitForCaption(element, { autoAdvanceMs = 0 } = {}) {
    element.setAttribute('role', 'button'); element.tabIndex = 0; element.style.cursor = 'pointer';
    return new Promise(resolve => {
        let done = false, timer;
        const next = event => {
            if (done || (event?.type === 'keydown' && (!['Enter', ' '].includes(event.key) || event.repeat))) return;
            event?.preventDefault(); event?.stopPropagation(); done = true;
            clearTimeout(timer);
            element.removeEventListener('click', next); element.removeEventListener('keydown', next); resolve();
        };
        element.addEventListener('click', next); element.addEventListener('keydown', next);
        if (autoAdvanceMs > 0) timer = setTimeout(next, autoAdvanceMs);
    });
}
