import { assets } from './State.js';

// Existing exhibition reads stay in their own save domain. No retired UI is opened.
export function renderExhibitionPhoneApp(state, id, content) {
    const line = text => {
        const p = document.createElement('p'); p.textContent = text; content.append(p);
    };
    if (id === 'messenger') {
        line('연락처'); line('모아 · 모아 안내소');
        line('대화 화면을 준비하고 있어요.'); return true;
    }
    if (id === 'stock' && state.flags.certificate) {
        line(`자산 ${assets(state).toLocaleString()}잎`);
        for (const trade of state.trades) line(`${trade.name} ${trade.quantity}주 · ${trade.price.toLocaleString()}잎 매수`);
        if (!state.trades.length) line('토리와 함께 첫 매수를 진행해 보세요.');
        return true;
    }
    if (id === 'profile') {
        line(state.nickname || '소망이');
        if (state.flags.bank) {
            line(`생활 계좌 · ${state.cash.toLocaleString()}잎`);
            if (state.debt) line(`빌린 정착 자금 · ${state.debt.toLocaleString()}잎`);
        }
        return true;
    }
    return false;
}
