import { MOA_SLEEP_TALK, MOA_WAKE_CALLS } from '../../data/moaWake.js';

export function createMoaMovementGuide(host, { inline = false, onInteract, onDirection } = {}) {
    const element = document.createElement('section');
    element.className = `moa-movement-guide${inline ? ' moa-movement-guide--inline' : ''}`;
    element.setAttribute('aria-label', '이동과 모아 깨우기 안내');
    element.innerHTML = `<strong>모아에게 다가가 보세요</strong>
        <p><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> 이동</p>
        <p>가까이에서 <kbd>F</kbd>를 <b>세 번</b> 눌러 모아를 깨워 주세요.</p>
        <p class="moa-movement-guide__status" role="status" aria-live="polite"></p>
        <div class="moa-movement-guide__controls"></div>
        <button type="button" data-interact></button>`;
    const controls = element.querySelector('.moa-movement-guide__controls');
    if (onDirection) for (const [label, key] of [['←', 'a'], ['↑', 'w'], ['↓', 's'], ['→', 'd']]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.setAttribute('aria-label', `${label} 방향으로 이동`);
        button.onpointerdown = event => { button.setPointerCapture(event.pointerId); onDirection(key, true); };
        button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => onDirection(key, false);
        controls.append(button);
    }
    const interactButton = element.querySelector('[data-interact]');
    interactButton.addEventListener('click', () => onInteract?.());
    const status = element.querySelector('[role=status]');
    element.hidden = true; host.append(element);
    let previous = '';
    return {
        element, interactButton,
        update({ visible = true, near = false, count = 0, busy = false } = {}) {
            element.hidden = !visible;
            const key = `${near}:${count}:${busy}`;
            if (key === previous) return;
            previous = key;
            interactButton.disabled = !near || busy;
            interactButton.textContent = busy ? '모아가 일어나고 있어요…'
                : near ? `F · 모아 부르기 (${count}/${MOA_WAKE_CALLS})` : `모아 가까이 이동해 주세요 (${count}/${MOA_WAKE_CALLS})`;
            status.textContent = busy ? '모아가 눈을 떴어요!' : `${MOA_SLEEP_TALK[Math.min(count, 2)]} · ${count} / ${MOA_WAKE_CALLS}`;
        },
        dispose() { element.remove(); }
    };
}
