import { playOpening } from './OpeningSequence.js';

// Artwork and hit target share one aspect-ratio box at every viewport size.
export function showTitleScreen(onStart) {
    const screen = document.createElement('section');
    screen.className = 'crayon-title';
    screen.setAttribute('aria-label', 'StockWars 시작 화면');
    screen.innerHTML = `
        <div class="crayon-title__art">
            <img src="assets/title/somangi-crayon-start.png" alt="크레파스로 그린 STOCKWARS와 손 흔드는 소망이" draggable="false">
            <button class="crayon-title__start" type="button" aria-label="게임 시작"></button>
        </div>`;
    document.body.append(screen);
    document.body.classList.add('title-screen-active');
    const app = document.getElementById('app');
    if (app) app.inert = true;
    const button = screen.querySelector('button');
    // World controls also listen on window; keep title input out of the world.
    const blockWorldInput = event => {
        event.stopImmediatePropagation();
        if (event.type === 'keydown' && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (!event.repeat) screen.querySelector('button')?.click();
        } else if (event.key === 'Tab') {
            event.preventDefault();
            screen.querySelector('button')?.focus({ preventScroll: true });
        }
    };
    window.addEventListener('keydown', blockWorldInput, true);
    window.addEventListener('keyup', blockWorldInput, true);
    button.addEventListener('click', async () => {
        button.disabled = true;
        await playOpening(screen);
        window.removeEventListener('keydown', blockWorldInput, true);
        window.removeEventListener('keyup', blockWorldInput, true);
        if (app) app.inert = false;
        screen.remove();
        document.body.classList.remove('title-screen-active');
        onStart();
    }, { once: true });
    button.focus({ preventScroll: true });
}
