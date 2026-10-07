export const CHART_PERIODS = { '1D': { days: 1, label: '1일' }, '1W': { days: 7, label: '1주' }, '1M': { days: 30, label: '1달' }, '1Y': { days: 365, label: '1년' } };
const HOUR = 3600000;
// Deterministic background history for the game's simulated market, independent of live quote RNG.
export function createChartHistory(stock, now = Date.now()) {
    let seed = 0; for (const c of stock.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const phase = (seed % 1000) / 100;
    const curve = hour => Math.sin(hour / 170 + phase) * .12 + Math.sin(hour / 43 + phase) * .035 + Math.sin(hour / 9 + phase) * .012;
    const end = 365 * 24, anchor = curve(end);
    return Array.from({ length: end + 1 }, (_, i) => ({ time: now - (end - i) * HOUR, price: Math.max(10, Math.round(stock.price * Math.exp(curve(i) - anchor))) }));
}
export function chartPeriod(history, timeframe, now = Date.now()) {
    const period = CHART_PERIODS[timeframe] || CHART_PERIODS['1D'];
    const start = now - period.days * 24 * HOUR;
    const samples = history.filter(p => p.time >= start && p.time <= now && Number.isFinite(p.price));
    if (!samples.length) return { samples: [], period, high: 0, low: 0, average: 0 };
    const prices = samples.map(p => p.price);
    return { samples, period, high: Math.max(...prices), low: Math.min(...prices), average: Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) };
}
export function chartTimeLabel(time, timeframe, tooltip = false) {
    const d = new Date(time), pad = n => String(n).padStart(2,'0');
    const date = pad(d.getMonth()+1) + '/' + pad(d.getDate());
    const clock = pad(d.getHours()) + ':' + pad(d.getMinutes());
    return tooltip ? d.getFullYear() + '/' + date + ' ' + clock : timeframe === '1D' ? clock : date;
}
