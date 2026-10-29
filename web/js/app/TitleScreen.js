import { playOpening } from './OpeningSequence.js';
import { playBusArrival } from './arrival/BusArrival.js';
import { getTownMusic } from '../engine/TownMusic.js';

// Static crayon artwork with a responsive two-choice menu.
export function showTitleScreen(onStart, { opening = true, arrival = true, buttonLabel = '', buttonImage = '', intro = null } = {}) {
    const screen = document.createElement('section');
    screen.className = 'crayon-title';
    screen.setAttribute('aria-label', 'StockWars 시작 화면');
    screen.innerHTML = `
        <div class="crayon-title__art">
            <img src="assets/title/flipbook-v1/frame-0.png" alt="크레파스로 그린 STOCKWARS와 손 흔드는 소망이" draggable="false">
            <nav class="crayon-title__menu" aria-label="게임 메뉴">
            <button class="crayon-title__start" type="button" aria-label="게임 시작">
                <img src="assets/title/flipbook-v1/start-button.png" alt="" aria-hidden="true" draggable="false">
            </button>
            </nav>
        </div>`;
    document.body.append(screen);
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
    let simulationActive = false;
    if (!intro && !buttonLabel) {
        const art = screen.querySelector('.crayon-title__art');
        art.classList.add('crayon-title__art--choices');
        button.replaceChildren(document.createTextNode('시작하기'));
        button.setAttribute('aria-label', '시작하기');
        button.classList.add('crayon-title__text-button');
        const simulation = document.createElement('button');
        simulation.type = 'button'; simulation.className = 'crayon-title__simulation';
        simulation.textContent = '주식 시뮬레이션 체험하기';
        art.querySelector('.crayon-title__menu').append(simulation);
        simulation.onclick = async () => {
            if (simulationActive || button.disabled) return;
            simulationActive = true; simulation.disabled = true;
            try { await (await import('./TitleSimulation.js')).openTitleSimulation(); }
            finally { simulationActive = false; simulation.disabled = false; simulation.focus({ preventScroll: true }); }
        };
    }
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
        if (simulationActive) return;
        event.stopImmediatePropagation();
        if (event.type === 'keydown' && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            if (ready && !event.repeat) (event.target?.matches('.bus-arrival__caption') ? event.target : document.activeElement?.matches('.crayon-title button') ? document.activeElement : button).click();
        } else if (event.type === 'keydown' && event.key === 'Tab') {
            event.preventDefault();
            const buttons = [...screen.querySelectorAll('button:not(:disabled), .bus-arrival__caption[tabindex="0"]')];
            const next = (buttons.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
            buttons[next]?.focus({ preventScroll: true });
        }
    };
    window.addEventListener('keydown', blockWorldInput, true);
    window.addEventListener('keyup', blockWorldInput, true);
    button.addEventListener('click', async () => {
        if (simulationActive) return;
        screen.querySelectorAll('button').forEach(button => { button.disabled = true; });
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
}
