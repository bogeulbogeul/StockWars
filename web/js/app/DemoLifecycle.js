export const DEMO_END_KEY = 'stockwars-demo-ended-v1';

export function isFinalSettlement(state) {
    return Number.isFinite(state?.day) && state.day >= 7;
}

export function clearDemoRecords(storage) {
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i));
    for (const key of keys) {
        if (key && key !== DEMO_END_KEY && /^stockwars[._-]/i.test(key)) storage.removeItem(key);
    }
}

export async function finishDemo(app) {
    if (app.demoEnded) return;
    app.demoEnded = true;
    app.itemGameplay?.pause();
    clearInterval(app.itemTimer);
    app.isLocalSession = true;
    app.appContainer.inert = true;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    const block = event => {
        if (event.target.closest?.('.demo-fade button')) return;
        event.preventDefault(); event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', block, true);
    window.addEventListener('keyup', block, true);
    const overlay = document.createElement('div');
    overlay.className = 'demo-fade';
    overlay.setAttribute('role', 'status');
    overlay.textContent = '데모를 마무리하고 있어요…';
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    try {
        // A completion tombstone is retained until all deletion is acknowledged.
        localStorage.setItem(DEMO_END_KEY, 'pending');
        const desktop = window.stockWarsDesktop;
        if (desktop?.markDemoComplete) {
            const result = await desktop.markDemoComplete();
            if (result?.error) throw new Error(result.error);
        }
        await new Promise(resolve => setTimeout(resolve, 850));
        if (desktop?.showDemoEnd) {
            const result = await desktop.showDemoEnd();
            if (result?.error) throw new Error(result.error);
        }
        else location.replace(new URL('demo-end.html', location.href));
    } catch {
        overlay.textContent = '데모 종료 상태를 저장하지 못했어요. 다시 시도해 주세요.';
        const retry = document.createElement('button');
        retry.textContent = '다시 시도';
        retry.onclick = () => {
            window.removeEventListener('keydown', block, true);
            window.removeEventListener('keyup', block, true);
            overlay.remove(); app.demoEnded = false; void finishDemo(app);
        };
        overlay.append(retry);
        retry.focus();
    }
}

export async function resumeDemoEnd() {
    const desktop = window.stockWarsDesktop;
    const status = await desktop?.demoStatus?.();
    if (!status?.ended && !localStorage.getItem(DEMO_END_KEY)) return false;
    if (desktop?.showDemoEnd) await desktop.showDemoEnd();
    else location.replace(new URL('demo-end.html', location.href));
    return true;
}
