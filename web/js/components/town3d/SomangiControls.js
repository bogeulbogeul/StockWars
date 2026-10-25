import { gameKey } from '../../app/GameKeys.js';

export function createSomangiControls(layer, play, blocked) {
    const hint = document.createElement('p');
    hint.className = 'somangi-controls';
    // Keep the internal hint reference used by room controllers, without a HUD.
    hint.hidden = true;
    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || blocked()) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        const jumping = gameKey(event) === 'space';
        if (jumping && event.target?.closest?.('button, a[href]')) return;
        const action = jumping ? 'jump' : event.code === 'Digit2' || event.key === '2' ? 'eat' : null;
        if (action && play(action)) event.preventDefault();
    });
    return hint;
}
