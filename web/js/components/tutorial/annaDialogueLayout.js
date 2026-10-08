// Bounds are measured in screen pixels, then converted to the game's logical pixels.
export function installAnnaDialogueLayout(overlay) {
    const update = () => {
        if (overlay.classList.contains('hidden')) return;
        const bounds = overlay.getBoundingClientRect();
        const scale = bounds.width / overlay.offsetWidth || 1;
        const gap = 32;
        let right = bounds.width / scale - gap;
        let top = gap;
        const visible = element => {
            const style = getComputedStyle(element);
            return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length;
        };
        for (const bar of document.querySelectorAll('.main-hud-bar, .demo-top-bar')) {
            if (visible(bar)) top = Math.max(top, (bar.getBoundingClientRect().bottom - bounds.top) / scale + gap);
        }
        const obstacles = document.querySelectorAll('.phone-shell, .modal-overlay:not(.hidden) > *, dialog[open]');
        for (const element of obstacles) {
            if (overlay.contains(element) || !visible(element)) continue;
            const rect = element.getBoundingClientRect();
            if (rect.bottom <= bounds.top + top * scale || rect.top >= bounds.bottom - gap * scale) continue;
            // Central panels reserve their entire left margin for the companion card.
            if (rect.right > bounds.left + bounds.width / 2 && rect.left > bounds.left) {
                right = Math.min(right, (rect.left - bounds.left) / scale - gap);
            }
        }
        overlay.style.setProperty('--anna-card-width', `${Math.max(1, Math.min(500, right - gap))}px`);
        overlay.style.setProperty('--anna-card-height', `${Math.max(1, bounds.height / scale - top - gap)}px`);
    };
    let frame;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'open'] });
    window.addEventListener('resize', schedule);
    // Re-measure once sliding phone/panel transitions have reached their final position.
    document.addEventListener('transitionend', schedule);
    schedule();
}
