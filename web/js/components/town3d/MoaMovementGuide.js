export function createMoaMovementGuide(host) {
    const element = document.createElement('section');
    element.className = 'moa-movement-guide';
    element.setAttribute('aria-label', '이동 안내');
    element.innerHTML = `<strong>모아에게 다가가 보세요</strong>
        <p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> 이동</p>
        <p>가까이에서 <kbd>F</kbd>를 세 번 눌러 모아를 깨워 주세요.</p>`;
    element.hidden = true; host.append(element);
    return {
        element,
        update({ visible = true } = {}) { element.hidden = !visible; },
        dispose() { element.remove(); }
    };
}
