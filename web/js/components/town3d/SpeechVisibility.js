// Use the displayed dialogue, including handoffs and ordinary NPC conversations.
export function isCharacterSpeaking() {
    if (typeof document === 'undefined') return false;
    return [...document.querySelectorAll('.exhibition-panel .exhibition-text, .vn-dialogue-text, .crayon-dialogue')]
        .some(node => node.textContent.trim() && node.getClientRects().length
            && getComputedStyle(node).visibility !== 'hidden');
}
