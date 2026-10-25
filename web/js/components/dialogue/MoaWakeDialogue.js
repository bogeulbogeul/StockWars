import { createDialogueNext } from './DialogueNext.js';
import { applyDialogueTheme } from './dialogueTheme.js';
import { MOA_SLEEP_TALK } from '../../data/moaWake.js';

// Reuse the existing resident panel/nameplate artwork; instructions stay elsewhere.
export function createMoaWakeDialogue() {
    const overlay = document.createElement('section');
    overlay.className = 'vn-tutorial-overlay hidden moa-wake-dialogue';
    overlay.setAttribute('aria-label', '모아 대화');
    overlay.innerHTML = `<div class="vn-dialogue-box dialogue-has-next"><div class="vn-content-wrapper">
        <div class="vn-top-bar"><div class="vn-nameplate"><span class="vn-speaker-name">모아</span></div></div>
        <div class="vn-dialogue-text" role="status" aria-live="polite"></div>
        </div></div>`;
    const panel = overlay.querySelector('.vn-dialogue-box');
    applyDialogueTheme(panel, 'moa');
    const hide = () => overlay.classList.add('hidden');
    let advance = hide;
    const text = overlay.querySelector('.vn-dialogue-text');
    panel.append(createDialogueNext(() => advance?.()));
    document.body.append(overlay);
    return {
        element: overlay,
        get isOpen() { return !overlay.classList.contains('hidden'); },
        showLine(message, { speaker = 'somang', name = '???', onNext = hide } = {}) {
            applyDialogueTheme(panel, speaker);
            overlay.setAttribute('aria-label', `${name} 대화`);
            overlay.querySelector('.vn-speaker-name').textContent = name;
            text.textContent = message; advance = onNext;
            overlay.classList.remove('hidden');
        },
        show(count) {
            applyDialogueTheme(panel, 'moa'); advance = hide; overlay.setAttribute('aria-label', '모아 대화');
            overlay.querySelector('.vn-speaker-name').textContent = '모아';
            text.textContent = MOA_SLEEP_TALK[Math.min(count, 2)];
            overlay.classList.remove('hidden');
        },
        hide,
        dispose() { overlay.remove(); }
    };
}
