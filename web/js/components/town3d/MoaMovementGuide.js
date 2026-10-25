export function createMoaMovementGuide(host, { follow = false, door = false, receive = false } = {}) {
    const element = document.createElement('section');
    element.className = 'moa-movement-guide';
    element.setAttribute('aria-label', receive ? '서류 받기 안내' : '이동 안내');
    element.innerHTML = receive ? `<strong>서류를 받아보자</strong>
        <p><kbd>F</kbd> · 서류 받기</p>` : door ? `<strong>문을 열고 들어가 보자</strong>
        <p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> 이동</p>
        <p>문 가까이에서 <kbd>F</kbd>를 눌러 문을 열어요.</p>` : follow ? `<strong>모아를 따라가 보자</strong>
        <p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> 이동</p>` : `<strong>모아에게 다가가 보세요</strong>
        <p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> 이동</p>
        <p>가까이에서 <kbd>F</kbd>를 세 번 눌러 모아를 깨워 주세요.</p>`;
    element.hidden = true; host.append(element);
    return {
        element,
        update({ visible = true, text } = {}) {
            const title = element.querySelector('strong');
            if (text && title.textContent !== text) title.textContent = text;
            element.hidden = !visible;
        },
        dispose() { element.remove(); }
    };
}
