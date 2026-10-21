const durations = [16, 20, 24, 24, 26, 30];

export function playOpening(screen) {
    // Called directly by the title click, so playback has a user gesture.
    const music = new Audio(new URL('../../assets/opening/first-little-journey-140s.mp3', import.meta.url).href);
    music.volume = .55;
    music.play().catch(() => { /* Audio restrictions must not block the opening. */ });
    return new Promise(resolve => {
        screen.classList.add('opening-sequence');
        screen.innerHTML = `
            <iframe title="소망이의 첫 여행 오프닝" tabindex="-1"></iframe>
            <button class="opening-sequence__skip" type="button">
                <span>건너뛰기</span><span class="opening-sequence__skip-icon" aria-hidden="true">››</span>
            </button>`;
        const frame = screen.querySelector('iframe');
        const skip = screen.querySelector('button');
        let timer;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            music.pause();
            music.currentTime = 0;
            music.removeAttribute('src');
            music.load();
            clearTimeout(timer);
            frame.onload = null;
            frame.onerror = null;
            resolve();
        };
        const play = index => {
            frame.onload = () => {
                if (finished) return;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (index + 1 < durations.length) play(index + 1);
                    else finish();
                }, durations[index] * 1000);
            };
            frame.onerror = finish;
            frame.src = new URL(`../../assets/opening/opening-scene-${String(index + 1).padStart(2, '0')}-v1/scene.html`, import.meta.url).href;
        };
        skip.addEventListener('click', finish, { once: true });
        skip.focus({ preventScroll: true });
        play(0);
    });
}
