export const KEY_ACTIONS = Object.freeze({ w: '위로 이동 / 물류 상자 쌓기', a: '왼쪽으로 이동', s: '아래로 이동', d: '오른쪽으로 이동', shift: '달리기 / 물류 질주', f: '상호작용', i: '가방 열기', p: '스마트폰 열기' });
export const DEFAULT_KEY_BINDINGS = Object.freeze({ w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', shift: 'ShiftLeft', f: 'KeyF', i: 'KeyI', p: 'KeyP' });
export function canonicalCode(code) { return code === 'ShiftRight' ? 'ShiftLeft' : code; }
export function isBindingCode(code) { return /^(Key[A-Z]|Space|ShiftLeft)$/.test(code) && !['KeyE', 'KeyR'].includes(code); }
export function keyLabel(code) { return /^Key[A-Z]$/.test(code) ? code.slice(3) : code === 'Space' ? 'Space' : code === 'ShiftLeft' ? 'Shift' : code; }
export function normalizeKeyBindings(value) {
    const result = { ...DEFAULT_KEY_BINDINGS };
    if (!value || typeof value !== 'object') return result;
    const codes = Object.keys(result).map(action => canonicalCode(value[action] ?? result[action]));
    // Reject a corrupt or conflicting map as a whole so every action stays usable.
    if (codes.some(code => !isBindingCode(code)) || new Set(codes).size !== codes.length) return result;
    Object.keys(result).forEach((action, index) => { result[action] = codes[index]; });
    return result;
}
