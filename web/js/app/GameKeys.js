// Physical keys keep the same controls with Korean and English keyboard layouts.
export function gameKey(event) {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return '';
    const code = event.code || '';
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'shift';
    if (code === 'Enter') return 'enter';
    if (code === 'Escape') return 'escape';
    if (code) return code.toLowerCase();
    return String(event.key || '').toLowerCase();
}
