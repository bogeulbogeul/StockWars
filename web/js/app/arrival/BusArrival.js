import { createArrivalView } from './BusArrivalView.js';

// A temporary cutscene; it never adds a vehicle to the persistent town scene.
export function playBusArrival(screen) {
    return new Promise(resolve => {
        screen.classList.add('bus-arrival');
        screen.innerHTML = `<div class="bus-arrival__stage" aria-label="마을에 도착하는 버스"></div>
            <p class="bus-arrival__caption" role="status">마을로 향하는 중…</p>
            <button class="opening-sequence__skip" type="button">건너뛰기 ››</button>`;
        const stage = screen.querySelector('.bus-arrival__stage');
        const caption = screen.querySelector('.bus-arrival__caption');
        const skip = screen.querySelector('button');
        let view, frame, finished = false, elapsed = 0, previous;
        const finish = () => {
            if (finished) return;
            finished = true;
            clearTimeout(loadTimeout);
            cancelAnimationFrame(frame);
            view?.dispose();
            screen.classList.remove('bus-arrival');
            resolve();
        };
        const loadTimeout = setTimeout(finish, 15000);
        skip.addEventListener('click', finish, { once: true });
        skip.focus({ preventScroll: true });
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        try { view = createArrivalView(stage); }
        catch { finish(); return; }
        view.ready.then(() => {
            if (finished) return;
            clearTimeout(loadTimeout);
            screen.dataset.arrivalState = 'driving';
            const tick = now => {
                if (finished) return;
                const delta = previous === undefined ? 0 : Math.min((now - previous) / 1000, .05);
                previous = now;
                if (!document.hidden) elapsed += delta;
                const progress = reduced ? 1 : Math.min(elapsed / 5, 1);
                // Cubic deceleration reaches zero speed at the stop.
                const distance = 10 * (1 - (1 - progress) ** 3);
                const playerView = reduced ? 1 : Math.min(Math.max((elapsed - 5) / 2, 0), 1);
                const departure = reduced ? (elapsed > 2 ? 7 : 0) : Math.max(elapsed - 8, 0);
                view.render(distance + Math.min(departure * departure * .5, 24), playerView);
                if (progress === 1) {
                    screen.dataset.arrivalState = elapsed >= 8 ? 'departing' : 'stopped';
                    caption.textContent = elapsed >= 8 ? '버스가 떠나고, 소망이의 첫날이 시작됩니다.' : '버스 정류장 안에서 모아가 꾸벅꾸벅 졸고 있어요.';
                }
                const duration = reduced ? 3 : 14;
                if (elapsed >= duration) finish();
                else frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }).catch(finish);
    });
}
