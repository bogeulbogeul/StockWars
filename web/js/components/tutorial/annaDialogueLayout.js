// Bounds are measured in screen pixels, then converted to the game's logical pixels.
export function installAnnaDialogueLayout(overlay) {
    const update = () => {
        if (overlay.classList.contains('hidden')) return;
        const bounds = overlay.getBoundingClientRect();
        const scale = bounds.width / overlay.offsetWidth || 1;
        const phone = document.querySelector?.('#floatingPhoneBtn');
        if (phone) {
            const target = phone.getBoundingClientRect();
            overlay.style.setProperty('--anna-focus-x', `${(target.left + target.width / 2 - bounds.left) / scale}px`);
            overlay.style.setProperty('--anna-focus-y', `${(target.top + target.height / 2 - bounds.top) / scale}px`);
        }
        const gap = 32;
        let right = bounds.width / scale - gap;
        let left = gap;
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
            if (rect.left < bounds.left + bounds.width / 2 && rect.right < bounds.right) {
                left = Math.max(left, (rect.right - bounds.left) / scale + gap);
            }
            // Reserve the margins beside visible panels.
            if (rect.right > bounds.left + bounds.width / 2 && rect.left > bounds.left) {
                right = Math.min(right, (rect.left - bounds.left) / scale - gap);
            }
        }
        const leftSpace = right - gap;
        const rightSpace = bounds.width / scale - gap - left;
        const useRight = leftSpace < 320 && rightSpace > leftSpace;
        overlay.style.setProperty('--anna-card-alignment', useRight ? 'flex-end' : 'flex-start');
        overlay.style.setProperty('--anna-card-width', `${Math.max(1, Math.min(500, useRight ? rightSpace : leftSpace))}px`);
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
