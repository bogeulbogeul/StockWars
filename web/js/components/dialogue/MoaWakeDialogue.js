import { applyDialogueTheme } from './dialogueTheme.js';
import { MOA_SLEEP_TALK, MOA_WAKE_CALLS } from '../../data/moaWake.js';

// Reuse the existing resident panel/nameplate artwork; instructions stay elsewhere.
export function createMoaWakeDialogue(onInteract) {
    const overlay = document.createElement('section');
    overlay.className = 'vn-tutorial-overlay hidden moa-wake-dialogue';
    overlay.setAttribute('aria-label', '모아 대화');
    overlay.innerHTML = `<div class="vn-dialogue-box"><div class="vn-content-wrapper">
        <div class="vn-top-bar"><div class="vn-nameplate"><span class="vn-speaker-name">모아</span></div>
        <button type="button" data-close>닫기</button></div>
        <div class="vn-dialogue-text" role="status" aria-live="polite"></div>
        <div class="moa-wake-dialogue__actions"><button type="button" data-call></button></div>
        </div></div>`;
    applyDialogueTheme(overlay.querySelector('.vn-dialogue-box'), 'moa');
    const text = overlay.querySelector('.vn-dialogue-text'), call = overlay.querySelector('[data-call]');
    const hide = () => overlay.classList.add('hidden');
    overlay.querySelector('[data-close]').addEventListener('click', hide);
    call.addEventListener('click', () => onInteract?.());
    document.body.append(overlay);
    return {
        element: overlay,
        show(count) {
            text.textContent = MOA_SLEEP_TALK[Math.min(count, 2)];
            call.textContent = `F · 다시 부르기 (${count}/${MOA_WAKE_CALLS})`;
            overlay.classList.remove('hidden');
        },
        hide,
        dispose() { overlay.remove(); }
    };
}
