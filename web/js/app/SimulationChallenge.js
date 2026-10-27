// A short, isolated market session; all executions still use MarketEngine.
export const SIMULATION_EVENTS = [
    { title: '데이터센터 투자 확대', text: '클라우드 설비 발주가 늘었습니다. IT 기업의 수주 기대와 에너지 수요가 함께 커집니다.', effects: { IT: .045, Energy: .025, Finance: -.012 } },
    { title: '원자재 공급 차질', text: '생산 비용이 높아졌습니다. 에너지와 소비재 업종의 움직임을 비교하고 보유할지, 팔지 판단해 보세요.', effects: { Energy: .055, Retail: -.045, IT: -.025, Infrastructure: -.03 } },
    { title: '소비 회복 소식', text: '소비와 문화 지출이 회복되고 있습니다. 마지막 시장 변화를 확인하고 매도할 시점을 정해 보세요.', effects: { Retail: .055, Entertainment: .05, Finance: .025, Energy: -.03 } }
];

export class SimulationChallenge {
    constructor(engine) { this.engine = engine; this.round = 0; this.finished = false; this.event = null; }
    get bought() { return this.engine.tradeHistory.some(t => t.side === 'buy' && t.quantity > 0); }
    get sold() { return this.engine.tradeHistory.some(t => t.side === 'sell' && t.quantity > 0); }
    get canFinish() { return this.round === SIMULATION_EVENTS.length && this.bought && this.sold; }
    advance() {
        if (this.finished || !this.bought || this.round >= SIMULATION_EVENTS.length) return false;
        this.event = SIMULATION_EVENTS[this.round++];
        const e = this.engine; e.bookRevision++;
        for (const stock of e.stocks.values()) {
            // Sector news affects the whole sector, never the player's chosen stock alone.
            const spread = [...stock.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 11 / 1000 - .005;
            stock.prevPrice = stock.price;
            stock.price = Math.max(10, Math.round(stock.price * (1 + (this.event.effects[stock.sector] ?? -.005) + spread)));
            const history = e.priceHistory.get(stock.id);
            history?.push(stock.price); if (history?.length > 50) history.shift();
            e.orderBooks.delete(stock.id);
        }
        e.notify(); // Also processes real pending limit orders against the new market.
        return true;
    }
    finish() {
        if (this.finished || !this.canFinish) return null;
        this.finished = true; this.engine.stopEngine();
        for (const order of [...this.engine.limitOrders]) this.engine.cancelLimitOrder(order.id);
        return this.result();
    }
    result() {
        const s = this.engine.getState(), profit = s.totalNetWorth - this.engine.initialCash;
        return { cash: s.cash, holdings: s.portfolioValue, assets: s.totalNetWorth, profit,
            returnPct: profit / this.engine.initialCash * 100, trades: this.engine.tradeHistory.length };
    }
}
