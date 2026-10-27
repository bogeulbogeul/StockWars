import { SimulationChallenge } from './SimulationChallenge.js';
import { money, num, esc } from '../components/phone/stock/StockFormat.js';

export function mountSimulationChallenge(phone, engine, source) {
    const challenge = new SimulationChallenge(engine);
    const panel = document.createElement('section'); panel.className = 'simulation-challenge';
    panel.setAttribute('aria-label', '세 번의 시장 변화 투자 도전');
    phone.detail.insertBefore(panel, phone.detail.querySelector('.cozy-phone__content'));
    const execute = source.execute;
    source.execute = (...args) => challenge.finished ? { success: false, msg: '체험이 끝났어요. 다시 도전해 보세요.' } : execute(...args);
    Object.defineProperty(source, 'readOnly', { get: () => challenge.finished ? '체험이 끝났어요. 계좌와 거래 내역을 확인할 수 있어요.' : null });
    let signature;
    function render() {
        const r = challenge.result();
        const nextSignature = [challenge.round, challenge.bought, challenge.sold, challenge.finished].join('/');
        const metrics = `<span>총자산 <b>${money(r.assets)}</b></span><span>손익 <b class="stock-${r.profit >= 0 ? 'up' : 'down'}">${r.profit >= 0 ? '+' : ''}${money(r.profit)}</b></span><span>${challenge.bought ? '✓' : '○'} 매수　${challenge.sold ? '✓' : '○'} 매도</span>`;
        if (signature === nextSignature) {
            const host = panel.querySelector('.simulation-metrics'); if (host) host.innerHTML = metrics;
            return;
        }
        signature = nextSignature;
        if (challenge.finished) {
            panel.innerHTML = `<div class="simulation-heading"><strong>투자 체험 완료</strong><span>매수·시장 대응·매도 완료</span></div><p>처음 5,000잎 → 최종 자산 <b>${money(r.assets)}</b> · <b class="stock-${r.profit >= 0 ? 'up' : 'down'}">${r.profit >= 0 ? '+' : ''}${money(r.profit)} (${num(r.returnPct)}%)</b></p><p>현금 ${money(r.cash)} + 남은 주식 평가액 ${money(r.holdings)} · 체결 ${r.trades}건<br>수수료를 포함한 결과예요. 남은 주식은 마지막 시세로 평가했습니다.</p><div class="simulation-actions"><button data-sim-review>거래 내역 보기</button><button data-sim-retry>다시 도전</button><button data-sim-exit>타이틀로</button></div>`;
            return;
        }
        const hint = !challenge.bought ? '기업 정보와 차트를 비교하고 원하는 종목을 매수하세요. 수량은 직접 정할 수 있어요.' : challenge.round < 3 ? '뉴스를 반영한 뒤 차트와 손익을 살펴보세요. 보유·추가 매수·매도를 직접 선택하세요.' : !challenge.sold ? '마지막 시세에서 보유 주식을 1주 이상 매도하면 결과를 볼 수 있어요.' : '세 번의 시장 변화를 경험했어요. 거래를 더 하거나 결과를 확인하세요.';
        panel.innerHTML = `<div class="simulation-heading"><strong>토리의 투자 도전</strong><span>가상 자금 5,000잎 · 시장 변화 ${challenge.round}/3</span></div><div class="simulation-metrics">${metrics}</div><p class="simulation-news"><b>${challenge.event ? esc(challenge.event.title) : '오늘의 시장: 서로 다른 업종을 비교해 보세요'}</b><br>${challenge.event ? esc(challenge.event.text) : 'IT·에너지·소비재 등 업종마다 뉴스에 반응하는 방향이 달라요.'}</p><div class="simulation-actions"><p role="status">${hint}</p><button data-sim-next ${!challenge.bought || challenge.round === 3 ? 'disabled' : ''}>다음 뉴스 반영 (${Math.min(3, challenge.round + 1)}/3)</button><button data-sim-finish ${!challenge.canFinish ? 'disabled' : ''}>결과 보기</button></div>${!challenge.bought ? '<div class="simulation-actions"><span>업종 비교</span><button data-sim-sector="IT">IT 기업</button><button data-sim-sector="Energy">에너지 기업</button><button data-sim-sector="Retail">소비재 기업</button></div>' : ''}`;
    }
    panel.onclick = event => {
        const b = event.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-sim-next')) challenge.advance();
        if (b.hasAttribute('data-sim-finish')) { challenge.finish(); phone.stockApp?.order?.refresh(); }
        if (b.hasAttribute('data-sim-review')) { phone.stockApp.tab = 'history'; phone.stockApp.renderTab(); }
        if (b.hasAttribute('data-sim-exit')) phone.close();
        if (b.dataset.simSector) { phone.stockApp.tab = 'market'; phone.stockApp.sector = b.dataset.simSector; phone.stockApp.renderTab(); }
        if (b.hasAttribute('data-sim-retry')) {
            challenge.round = 0; challenge.finished = false; challenge.event = null;
            engine.reset(); phone.stockApp.tab = 'market'; phone.stockApp.sector = 'ALL'; phone.stockApp.query = ''; phone.stockApp.renderTab();
        }
        render();
        // Keep keyboard focus usable when a quote update replaces the panel.
        if (b.hasAttribute('data-sim-next')) panel.querySelector('[data-sim-next]:not(:disabled), [data-sim-finish]:not(:disabled)')?.focus({ preventScroll: true });
    };
    // Quote ticks only update numbers. Do not replace focused controls or news text.
    const off = engine.subscribe(() => { if (!challenge.finished) render(); });
    render();
    return () => { off(); panel.remove(); };
}
