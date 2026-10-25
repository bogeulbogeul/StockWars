export function createSomangiControls(layer, play, blocked) {
    const hint = document.createElement('p');
    hint.className = 'somangi-controls';
    // Keep the internal hint reference used by room controllers, without a HUD.
    hint.hidden = true;
    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || blocked()) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        const action = event.code === 'Digit2' || event.key === '2' ? 'eat' : null;
        if (action && play(action)) event.preventDefault();
    });
    return hint;
}
