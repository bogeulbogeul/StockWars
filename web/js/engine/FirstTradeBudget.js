export const FIRST_TRADE_BUDGET = 1500;
// Keep displayed recommendations and actual order eligibility identical.
export function firstTradeChoices(stocks, cash) {
    const budget = Math.max(0, Math.min(FIRST_TRADE_BUDGET, Number.isFinite(cash) ? cash : 0));
    return { budget, choices: stocks.filter(s => Number.isFinite(s.price) && s.price > 0 && s.price <= budget).slice(0, 6) };
}
