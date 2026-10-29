// Optional timed playback; caption input always advances immediately.
export function bindCinematicDialogue(frame, onComplete, { autoAdvanceMs = 0 } = {}) {
    let clear = () => {};
    const load = () => {
        clear();
        const doc = frame.contentDocument;
        const captions = [...doc.querySelectorAll('.caption')];
        if (!captions.length) return;
        const veil = doc.querySelector('.veil');
        if (veil) { veil.style.animation = 'none'; veil.style.opacity = '0'; }
        let index = 0, completed = false, timer;
        const delay = typeof autoAdvanceMs === 'function' ? autoAdvanceMs(captions) : autoAdvanceMs;
        const arm = () => { clearTimeout(timer); if (delay > 0) timer = setTimeout(() => advance(), delay); };
        const render = () => captions.forEach((caption, i) => {
            caption.style.setProperty('animation', 'none', 'important');
            caption.style.setProperty('opacity', '1', 'important');
            caption.style.setProperty('transform', 'none', 'important');
            caption.style.setProperty('display', i === index ? 'block' : 'none', 'important');
            caption.style.setProperty('pointer-events', 'auto', 'important');
            caption.style.cursor = 'pointer';
            caption.setAttribute('role', 'button'); caption.tabIndex = i === index ? 0 : -1;
            caption.setAttribute('aria-label', caption.textContent.trim() + ' · 클릭하여 다음');
        });
        const advance = event => {
            if (completed || (event?.type === 'keydown' && (!['Enter', ' '].includes(event.key) || event.repeat))) return;
            event?.preventDefault(); event?.stopPropagation(); clearTimeout(timer);
            if (index + 1 < captions.length) { index++; render(); arm(); if (event) captions[index].focus({ preventScroll: true }); }
            else { completed = true; clear(); onComplete(); }
        };
        for (const caption of captions) {
            caption.addEventListener('click', advance);
            caption.addEventListener('keydown', advance);
        }
        clear = () => {
            completed = true; clearTimeout(timer);
            captions.forEach(caption => {
                caption.removeEventListener('click', advance); caption.removeEventListener('keydown', advance);
            });
        };
        render(); arm();
    };
    frame.addEventListener('load', load);
    return () => { clear(); frame.removeEventListener('load', load); };
}
