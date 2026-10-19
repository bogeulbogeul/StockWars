export function createSomangiControls(layer, play, blocked) {
    const hint = document.createElement('p');
    hint.className = 'somangi-controls';
    hint.textContent = '소망이 준비 중…';
    layer.append(hint);
    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || blocked()) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        const action = event.code === 'Digit1' || event.key === '1' ? 'wave'
            : event.code === 'Digit2' || event.key === '2' ? 'eat'
                : event.code === 'Space' || event.key === ' ' ? 'jump' : null;
        if (action && play(action)) event.preventDefault();
    });
    return hint;
}
