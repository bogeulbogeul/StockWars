import { money } from '../components/phone/stock/StockFormat.js';

// The standalone experience is a free-trading session without challenge steps.
export function mountSimulationChallenge(phone, engine) {
    const panel = document.createElement('section');
    panel.className = 'simulation-challenge';
    panel.setAttribute('aria-label', '체험 계좌 요약');
    phone.detail.insertBefore(panel, phone.detail.querySelector('.cozy-phone__content'));
    const render = () => {
        const state = engine.getState();
        const profit = state.totalNetWorth - engine.initialCash;
        panel.innerHTML = `<div class="simulation-metrics"><span>총자산 <b>${money(state.totalNetWorth)}</b></span><span>손익 <b class="stock-${profit >= 0 ? 'up' : 'down'}">${profit >= 0 ? '+' : ''}${money(profit)}</b></span></div>`;
    };
    const off = engine.subscribe(render);
    render();
    return () => { off(); panel.remove(); };
}
