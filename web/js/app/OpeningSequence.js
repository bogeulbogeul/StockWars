import { bindCinematicDialogue } from './CinematicDialogue.js';

const sceneCount = 6;
const sceneDurations = [12_000, 16_000, 19_000, 19_000, 21_000, 23_000];

export function playOpening(screen) {
    return new Promise(resolve => {
        screen.classList.add('opening-sequence');
        screen.innerHTML = `
            <iframe title="소망이의 첫 여행 오프닝" tabindex="-1"></iframe>
            <button class="opening-sequence__skip" type="button">
                <span>건너뛰기</span><span class="opening-sequence__skip-icon" aria-hidden="true">››</span>
            </button>`;
        const frame = screen.querySelector('iframe');
        const skip = screen.querySelector('button');
        let index = 0;
        const cleanup = bindCinematicDialogue(frame, () => {
            if (index + 1 < sceneCount) play(++index);
            else finish();
        }, { autoAdvanceMs: captions => sceneDurations[index] / Math.max(1, captions.length), advanceOnScreen: true });
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            cleanup();
            frame.onload = null;
            frame.onerror = null;
            resolve();
        };
        const play = index => {
            frame.onerror = finish;
            frame.src = new URL(`../../assets/opening/opening-scene-${String(index + 1).padStart(2, '0')}-v1/scene.html`, import.meta.url).href;
        };
        skip.addEventListener('click', finish, { once: true });
        skip.focus({ preventScroll: true });
        play(0);
    });
}
