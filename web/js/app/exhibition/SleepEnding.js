import { bindCinematicDialogue } from '../CinematicDialogue.js';
import { showTitleScreen } from '../TitleScreen.js';

// Return to a clean title; session-only exhibition progress resets on reload.
export function titleReturnUrl(currentUrl) {
    const url = new URL(currentUrl);
    url.searchParams.delete('skipOpening');
    return url.href;
}

export function playFirstNight(screen) {
    const art = screen.querySelector('.crayon-title__art');
    art.hidden = true;
    screen.classList.add('opening-sequence');
    const frame = document.createElement('iframe');
    frame.title = '소망이의 첫날 밤 잠자기 애니메이션';
    frame.tabIndex = -1;
    screen.append(frame);
    return new Promise(resolve => {
        let finished = false;
        const cleanup = bindCinematicDialogue(frame, () => finish());
        const finish = () => {
            if (finished) return;
            finished = true;
            cleanup();
            frame.onload = frame.onerror = null;
            frame.remove();
            screen.classList.remove('opening-sequence');
            art.hidden = false;
            resolve();
        };
        frame.onerror = finish;
        frame.src = new URL('../../../assets/ending/first-night-v1/scene.html', import.meta.url).href;
    });
}

export function showSleepEnding() {
    showTitleScreen(() => location.assign(titleReturnUrl(location.href)), {
        opening: false,
        arrival: false,
        buttonLabel: '타이틀 화면으로 가기',
        buttonImage: 'assets/title/flipbook-v1/return-button.png',
        intro: async screen => {
            await playFirstNight(screen);
            screen.classList.add('demo-complete'); screen.setAttribute('aria-label', '데모 종료');
            const art = screen.querySelector('.crayon-title__art');
            const heading = document.createElement('h1'); heading.textContent = '데모가 끝났습니다';
            const thanks = document.createElement('p'); thanks.textContent = '소망이의 첫날을 함께해 주셔서 고마워요.';
            art.prepend(heading, thanks);
            const button = art.querySelector('button'); button.textContent = '타이틀 화면으로 가기';
        }
    });
}
