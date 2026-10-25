// Existing exhibition reads stay in their own save domain. No retired UI is opened.
export function renderExhibitionPhoneApp(state, id, content) {
    const line = text => {
        const p = document.createElement('p'); p.textContent = text; content.append(p);
    };
    if (id === 'messenger') {
        line('연락처'); line('모아 · 모아 안내소');
        line('대화 화면을 준비하고 있어요.'); return true;
    }
    if (id === 'profile') {
        line(state.nickname || '???');
        if (state.flags.bank) {
            line(`생활 계좌 · ${state.cash.toLocaleString()}잎`);
            if (state.debt) line(`빌린 정착 자금 · ${state.debt.toLocaleString()}잎`);
        }
        return true;
    }
    return false;
}
