import { CHART_PERIODS, chartPeriod, chartPriceRange, chartTimeLabel } from '../../../engine/ChartTimeframes.js';
import { esc, money, num } from './StockFormat.js';

export function chartScreen(history, period = 'LIVE', expanded = false) {
    const data = chartPeriod(history, period), { samples } = data;
    const prices = samples.map(s => s.price);
    const stride = Math.max(1, Math.ceil(samples.length / 400));
    const shown = samples.filter((_, i) => i % stride === 0 || i === samples.length - 1);
    const { minPrice, maxPrice } = prices.length ? chartPriceRange(prices) : { minPrice: 0, maxPrice: 1 };
    const points = shown.map((s, i) => `${36 + i / Math.max(1, shown.length - 1) * 280},${160 - (s.price - minPrice) / (maxPrice - minPrice) * 140}`).join(' ');
    return `<div class="stock-chart-controls">${Object.entries(CHART_PERIODS).map(([key, p]) => `<button type="button" data-period="${key}" aria-pressed="${key === period}">${esc(p.label)}</button>`).join('')}<button type="button" data-expand>${expanded ? '축소' : '차트 확대'}</button></div><p class="stock-caption">게임 시세 기록 · 상승 빨강 / 하락 파랑</p><svg class="stock-chart${expanded ? ' stock-chart--expanded' : ''}" viewBox="0 0 360 200" role="img" aria-label="${esc(data.period.label)} 주가 차트"><g stroke="#deded2" stroke-width="1">${[20, 65, 110, 160].map(y => `<path d="M36 ${y}H320"/>`).join('')}</g><polyline points="${points}" fill="none" stroke="${prices.at(-1) >= prices[0] ? '#bd655b' : '#5b84a7'}" stroke-width="2"/><g fill="#6c7065" font-size="10"><text x="324" y="25">${num(maxPrice)}</text><text x="324" y="160">${num(minPrice)}</text><text x="36" y="190">${samples.length ? esc(chartTimeLabel(samples[0].time, period)) : ''}</text><text x="255" y="190">${samples.length ? esc(chartTimeLabel(samples.at(-1).time, period)) : ''}</text></g></svg><p class="stock-caption">최고 ${money(data.high)} · 최저 ${money(data.low)} · 평균 ${money(data.average)}</p>`;
}

export function bindChartPointer(host, history, period) {
    const svg = host.querySelector('.stock-chart');
    if (!svg) return;
    const { samples } = chartPeriod(history, period);
    const output = document.createElement('output'); output.className = 'stock-caption';
    output.textContent = '차트를 가리키거나 터치하면 시각과 가격을 확인할 수 있어요.';
    svg.after(output);
    svg.onpointermove = svg.onpointerdown = event => {
        if (!samples.length) return;
        const rect = svg.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 360;
        const index = Math.max(0, Math.min(samples.length - 1, Math.round((x - 36) / 280 * (samples.length - 1))));
        const sample = samples[index];
        output.textContent = `${chartTimeLabel(sample.time, period, true)} · ${money(sample.price)}`;
    };
}
