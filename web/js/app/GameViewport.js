import { isExhibitionMode } from './exhibition/Mode.js';
/** Uniform game UI scale; exhibition uses native pixels for readable small screens. */
export function measureGameViewport(width, height) {
    const scale = Math.min(width / 1600, height / 1080);
    return { scale, width: width / scale, height: height / scale };
}
export function installGameViewport() {
    const root = document.documentElement;
    const update = () => {
        const width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight);
        const view = isExhibitionMode() ? { scale: 1, width, height } : measureGameViewport(width, height);
        root.style.zoom = String(view.scale);
        root.style.width = view.width + 'px';
        root.style.height = view.height + 'px';
        root.style.setProperty('--game-vw', view.width / 100 + 'px');
        root.style.setProperty('--game-vh', view.height / 100 + 'px');
        root.style.setProperty('--game-vmin', Math.min(view.width, view.height) / 100 + 'px');
        root.style.setProperty('--game-vmax', Math.max(view.width, view.height) / 100 + 'px');
        root.style.setProperty('--game-ui-scale', String(view.scale));
    };
    update();
    // Run before component resize listeners so they measure the new logical layout.
    window.addEventListener('resize', update);
}
export function elementScale(element) {
    const rect = element.getBoundingClientRect();
    return element.offsetWidth && rect.width ? rect.width / element.offsetWidth : 1;
}
if (typeof window !== 'undefined' && typeof document !== 'undefined') installGameViewport();


