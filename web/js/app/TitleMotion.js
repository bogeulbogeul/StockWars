const framePaths = [1, 2].map(index => `assets/title/flipbook-v1/frame-${index}.png`);
const sequence = [0, 1, 0, 2, 0, 1, 0, 2, 0];
const durations = [240, 220, 220, 220, 220, 220, 220, 220, 1100];

// Complete, pre-drawn PNG frames; no deformation or interpolation.
export function animateTitle(art) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const frames = framePaths.map(src => {
        const image = new Image();
        image.src = src;
        image.className = 'crayon-title__frame';
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        image.draggable = false;
        image.hidden = true;
        return image;
    });
    let timer, position = 0, disposed = false, ready = false;
    const show = index => {
        frames.forEach((image, i) => { image.hidden = index !== i + 1; });
        art.dataset.frame = String(index);
    };
    const next = () => {
        if (disposed || !ready || reducedMotion.matches || document.hidden) return;
        show(sequence[position]);
        timer = setTimeout(() => {
            position = (position + 1) % sequence.length;
            next();
        }, durations[position]);
    };
    const resume = () => {
        clearTimeout(timer);
        position = 0;
        show(0);
        next();
    };
    Promise.all(frames.map(image => image.decode())).then(() => {
        if (disposed) return;
        frames.forEach(image => art.append(image));
        ready = true;
        resume();
    }).catch(() => { show(0); });
    reducedMotion.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
        disposed = true;
        clearTimeout(timer);
        reducedMotion.removeEventListener('change', resume);
        document.removeEventListener('visibilitychange', resume);
        frames.forEach(image => image.remove());
    };
}
