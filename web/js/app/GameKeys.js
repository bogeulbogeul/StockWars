import { settingsStore } from '../engine/SettingsStore.js';
import { DEFAULT_KEY_BINDINGS, canonicalCode, keyLabel } from '../engine/KeyBindings.js';

export function bindingLabel(action) { return keyLabel(settingsStore.value.keyBindings[action]); }
export function refreshKeyHints(root = document) {
    root.querySelectorAll('[data-game-key]').forEach(el => { el.textContent = bindingLabel(el.dataset.gameKey); });
}
if (typeof window !== 'undefined') window.addEventListener('stockwars-settings-changed', () => refreshKeyHints());

// Return logical controls, independently of the keyboard language and assigned physical key.
export function gameKey(event) {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return '';
    let code = event.code || '';
    if (!code) {
        const key = String(event.key || '').toLowerCase();
        code = /^[a-z]$/.test(key) ? 'Key' + key.toUpperCase() : ({ shift: 'ShiftLeft', ' ': 'Space', enter: 'Enter', escape: 'Escape' }[key] || event.key || '');
    }
    code = canonicalCode(code);
    const bindings = settingsStore.value.keyBindings;
    const action = Object.keys(bindings).find(action => bindings[action] === code);
    if (action) return action;
    const arrow = { ArrowUp: 'w', ArrowLeft: 'a', ArrowDown: 's', ArrowRight: 'd' }[code];
    if (arrow) return arrow;
    // A former action key must stop triggering its previous command.
    if (Object.values(DEFAULT_KEY_BINDINGS).includes(code)) return '';
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    return code.toLowerCase();
}
