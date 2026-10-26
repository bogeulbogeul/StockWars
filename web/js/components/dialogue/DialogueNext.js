export function createDialogueNext(action, { label = '다음 대사' } = {}) {
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'dialogue-next-triangle';
    next.setAttribute('aria-label', label);
    next.addEventListener('click', () => action?.());
    return next;
}
