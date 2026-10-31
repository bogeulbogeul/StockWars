import { createArrivalView } from './BusArrivalView.js';
import { createBusArrivalAudio } from './BusArrivalAudio.js';

// A temporary cutscene; it never adds a vehicle to the persistent town scene.
export function playBusArrival(screen) {
    return new Promise(resolve => {
        screen.classList.add('bus-arrival');
        screen.innerHTML = `<div class="bus-arrival__stage" aria-label="마을에 도착하는 버스"></div>
            <p class="bus-arrival__caption" role="status">마을을 불러오는 중…</p>
            <button class="opening-sequence__skip" type="button">건너뛰기 ››</button>`;
        const stage = screen.querySelector('.bus-arrival__stage');
        const caption = screen.querySelector('.bus-arrival__caption');
        const skip = screen.querySelector('button');
        const previousCursor = screen.style.cursor;
        let view, audio, frame, autoTimer, finished = false, elapsed = 0, previous, departedAt, phase = 0, ready = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            clearTimeout(loadTimeout);
            clearTimeout(autoTimer);
            screen.removeEventListener('click', screenClick);
            caption.removeEventListener('keydown', advance);
            screen.style.cursor = previousCursor;
            cancelAnimationFrame(frame);
            audio?.dispose();
            view?.dispose();
            screen.classList.remove('bus-arrival');
            resolve();
        };
        caption.setAttribute('role', 'button'); caption.tabIndex = 0; caption.style.cursor = 'pointer';
        const advance = event => {
            if (!ready || finished || (event?.type === 'keydown' && (!['Enter', ' '].includes(event.key) || event.repeat))) return;
            event?.preventDefault(); event?.stopPropagation(); clearTimeout(autoTimer);
            if (phase === 0) { phase = 1; elapsed = Math.max(elapsed, 5); }
            else if (phase === 1) { phase = 2; elapsed = Math.max(elapsed, 8); }
            else { finish(); return; }
            arm();
        };
        const arm = () => { clearTimeout(autoTimer); autoTimer = setTimeout(() => advance(), [5000, 3000, 8000][phase]); };
        const screenClick = event => {
            if (event.target.closest?.('button,a,input,textarea,select')) return;
            advance(event);
        };
        screen.style.cursor = 'pointer';
        screen.addEventListener('click', screenClick); caption.addEventListener('keydown', advance);
        const loadTimeout = setTimeout(finish, 15000);
        skip.addEventListener('click', finish, { once: true });
        skip.focus({ preventScroll: true });
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        try { view = createArrivalView(stage); }
        catch { finish(); return; }
        view.ready.then(() => {
            if (finished) return;
            clearTimeout(loadTimeout); ready = true;
            arm();
            audio = createBusArrivalAudio();
            screen.dataset.arrivalState = 'driving';
            const tick = now => {
                if (finished) return;
                const delta = previous === undefined ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now;
                if (!document.hidden) elapsed = phase === 0 ? Math.min(5, elapsed + delta) : phase === 1 ? Math.min(8, elapsed + delta) : elapsed + delta;
                const progress = reduced ? 1 : Math.min(elapsed / 5, 1);
                // Cubic deceleration reaches zero speed at the stop.
                const distance = 10 * (1 - (1 - progress) ** 3);
                const playerView = reduced ? 1 : Math.min(Math.max((elapsed - 5) / 2, 0), 1);
                const departure = phase < 2 ? 0 : reduced ? 7 : Math.max(elapsed - 8, 0);
                const rendered = view.render(distance + departure * departure * .5, playerView, progress === 1);
                const departing = phase >= 2;
                if (departing && rendered?.busVisible === false && departedAt === undefined) {
                    departedAt = elapsed;
                    const focused = document.activeElement === skip;
                    skip.remove();
                    if (focused) { screen.tabIndex = -1; screen.focus({ preventScroll: true }); }
                }
                screen.dataset.arrivalState = departedAt !== undefined ? 'departed' : departing ? 'departing' : progress === 1 ? 'stopped' : 'driving';
                audio.update({ progress, departure, departed: departedAt !== undefined });
                caption.hidden = false;
                caption.textContent = phase === 0 ? '포포리 마을이 보이기 시작했어요.' : phase === 1 ? '포포리에 도착했어요. 이제 내려볼까요?' : '버스 정류장 안에서 누군가 꾸벅꾸벅 졸고 있어요.';
                if (departedAt !== undefined) caption.textContent = '버스 정류장 안에서 누군가 꾸벅꾸벅 졸고 있어요.';
                if (departedAt === undefined || elapsed - departedAt < .25) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }).catch(finish);
    });
}
