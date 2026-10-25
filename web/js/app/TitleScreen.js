import { playOpening } from './OpeningSequence.js';
import { animateTitle } from './TitleMotion.js';
import { playBusArrival } from './arrival/BusArrival.js';
import { getTownMusic } from '../engine/TownMusic.js';

// Artwork and hit target share one aspect-ratio box at every viewport size.
export function showTitleScreen(onStart, { opening = true, arrival = true, buttonLabel = '', buttonImage = '', intro = null } = {}) {
    const screen = document.createElement('section');
    screen.className = 'crayon-title';
    screen.setAttribute('aria-label', 'StockWars 시작 화면');
    screen.innerHTML = `
        <div class="crayon-title__art">
            <img src="assets/title/flipbook-v1/frame-0.png" alt="크레파스로 그린 STOCKWARS와 손 흔드는 소망이" draggable="false">
            <button class="crayon-title__start" type="button" aria-label="게임 시작">
                <img src="assets/title/flipbook-v1/start-button.png" alt="" aria-hidden="true" draggable="false">
            </button>
        </div>`;
    document.body.append(screen);
    const stopMotion = animateTitle(screen.querySelector('.crayon-title__art'));
    document.body.classList.add('title-screen-active');
    const music = getTownMusic();
    if (!intro) music.setTitleActive(true, screen);
    const app = document.getElementById('app');
    if (app) app.inert = true;
    const button = screen.querySelector('button');
    if (buttonLabel) {
        button.setAttribute('aria-label', buttonLabel);
        if (!buttonImage) {
            button.replaceChildren(document.createTextNode(buttonLabel));
            button.classList.add('crayon-title__text-button');
        }
    }
    if (buttonImage) button.querySelector('img').src = buttonImage;
    let ready = !intro;
    if (intro) {
        button.disabled = true;
        void intro(screen).finally(() => {
            ready = true;
            button.disabled = false;
            music.setTitleActive(true, screen);
            button.focus({ preventScroll: true });
        });
    }
    // World controls also listen on window; keep title input out of the world.
    const blockWorldInput = event => {
        event.stopImmediatePropagation();
        if (event.type === 'keydown' && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (ready && !event.repeat) screen.querySelector('button')?.click();
        } else if (event.type === 'keydown' && event.key === 'Tab') {
            event.preventDefault();
            const buttons = [...screen.querySelectorAll('button:not(:disabled)')];
            const next = (buttons.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
            buttons[next]?.focus({ preventScroll: true });
        }
    };
    window.addEventListener('keydown', blockWorldInput, true);
    window.addEventListener('keyup', blockWorldInput, true);
    button.addEventListener('click', async () => {
        button.disabled = true;
        stopMotion();
        music.setTitleActive(false);
        if (opening) await playOpening(screen);
        if (arrival) await playBusArrival(screen);
        await onStart();
        window.removeEventListener('keydown', blockWorldInput, true);
        window.removeEventListener('keyup', blockWorldInput, true);
        if (app) app.inert = false;
        screen.remove();
        document.body.classList.remove('title-screen-active');
        window.dispatchEvent(new Event('stockwars-arrival-finished'));
    }, { once: true });
    button.focus({ preventScroll: true });
}
