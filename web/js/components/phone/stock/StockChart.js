import { CHART_PERIODS, chartPeriod, chartPriceRange, chartTimeLabel } from '../../../engine/ChartTimeframes.js';
import { esc, money, num } from './StockFormat.js';

export function chartScreen(history, period = 'LIVE', expanded = false) {
    const data = chartPeriod(history, period), { samples } = data;
    const prices = samples.map(s => s.price);
    const stride = Math.max(1, Math.ceil(samples.length / 400));
    const shown = samples.map((sample, index) => ({ ...sample, index })).filter(s => s.index % stride === 0 || s.index === samples.length - 1);
    const { minPrice, maxPrice } = prices.length ? chartPriceRange(prices) : { minPrice: 0, maxPrice: 1 };
    const points = shown.map(s => `${36 + s.index / Math.max(1, samples.length - 1) * 280},${160 - (s.price - minPrice) / (maxPrice - minPrice) * 140}`).join(' ');
    return `<div class="stock-chart-controls">${Object.entries(CHART_PERIODS).map(([key, p]) => `<button type="button" data-period="${key}" aria-pressed="${key === period}">${esc(p.label)}</button>`).join('')}<button type="button" data-expand aria-pressed="${expanded}">${expanded ? '원래 크기' : '차트 확대'}</button></div><p class="stock-caption">게임 시세 기록 · 상승 빨강 / 하락 파랑</p><svg class="stock-chart${expanded ? ' stock-chart--expanded' : ''}" viewBox="0 0 360 200" role="img" aria-label="${esc(data.period.label)} 주가 차트"><g stroke="#deded2" stroke-width="1">${[20, 65, 110, 160].map(y => `<path d="M36 ${y}H320"/>`).join('')}</g><polyline points="${points}" fill="none" stroke="${prices.at(-1) >= prices[0] ? '#bd655b' : '#5b84a7'}" stroke-width="2"/><g fill="#6c7065" font-size="10"><text x="324" y="25">${num(maxPrice)}</text><text x="324" y="160">${num(minPrice)}</text><text x="36" y="190">${samples.length ? esc(chartTimeLabel(samples[0].time, period)) : ''}</text><text x="255" y="190">${samples.length ? esc(chartTimeLabel(samples.at(-1).time, period)) : ''}</text></g></svg><p class="stock-caption">최고 ${money(data.high)} · 최저 ${money(data.low)} · 평균 ${money(data.average)}</p>`;
}

export function bindChartPointer(host, history, period) {
    const svg = host.querySelector('.stock-chart');
    if (!svg) return;
    const { samples } = chartPeriod(history, period);
    const stride = Math.max(1, Math.ceil(samples.length / 400));
    const plotted = samples.map((sample, index) => ({ ...sample, index })).filter(s => s.index % stride === 0 || s.index === samples.length - 1);
    const prices = samples.map(s => s.price);
    const { minPrice, maxPrice } = prices.length ? chartPriceRange(prices) : { minPrice: 0, maxPrice: 1 };
    const output = document.createElement('output'); output.className = 'stock-caption stock-chart-readout';
    const hint = '차트를 가리키거나 터치하면 시각과 가격을 확인할 수 있어요.';
    output.textContent = hint; svg.after(output);
    const ns = 'http://www.w3.org/2000/svg';
    const cursor = document.createElementNS(ns, 'g');
    cursor.setAttribute('class', 'stock-chart-cursor'); cursor.setAttribute('visibility', 'hidden'); cursor.setAttribute('pointer-events', 'none');
    cursor.innerHTML = '<line class="stock-chart-cross-x" y1="20" y2="160"/><line class="stock-chart-cross-y" x1="36" x2="320"/><circle r="4"/><rect class="stock-chart-tooltip" width="238" height="24" rx="4"/><text class="stock-chart-tooltip-text" font-size="10"></text>';
    svg.append(cursor);
    const show = ratio => {
        if (!plotted.length) return;
        const index = Math.max(0, Math.min(samples.length - 1, ratio * (samples.length - 1)));
        const sample = plotted.reduce((best, s) => Math.abs(s.index - index) < Math.abs(best.index - index) ? s : best, plotted[0]);
        const x = 36 + sample.index / Math.max(1, samples.length - 1) * 280;
        const y = 160 - (sample.price - minPrice) / (maxPrice - minPrice) * 140;
        const label = `${chartTimeLabel(sample.time, period, true)} · ${money(sample.price)}`;
        cursor.setAttribute('visibility', 'visible');
        const vertical = cursor.querySelector('.stock-chart-cross-x'); vertical.setAttribute('x1', x); vertical.setAttribute('x2', x);
        const horizontal = cursor.querySelector('.stock-chart-cross-y'); horizontal.setAttribute('y1', y); horizontal.setAttribute('y2', y);
        const point = cursor.querySelector('circle'); point.setAttribute('cx', x); point.setAttribute('cy', y);
        const left = Math.max(36, Math.min(82, x - 119)), top = y < 65 ? 132 : 22;
        const box = cursor.querySelector('rect'); box.setAttribute('x', left); box.setAttribute('y', top);
        const text = cursor.querySelector('text'); text.setAttribute('x', left + 8); text.setAttribute('y', top + 16); text.textContent = label;
        output.textContent = label;
        host.dataset.chartCursorRatio = String(ratio); host.dataset.chartCursorPeriod = period;
    };
    svg.onpointermove = svg.onpointerdown = event => {
        const matrix = svg.getScreenCTM(); if (!matrix) return;
        // getScreenCTM includes SVG letterboxing, zoom and chart expansion.
        const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
        const local = point.matrixTransform(matrix.inverse());
        show(Math.max(0, Math.min(1, (local.x - 36) / 280)));
    };
    svg.onpointerleave = event => {
        if (event.pointerType === 'touch') return;
        cursor.setAttribute('visibility', 'hidden'); output.textContent = hint;
        delete host.dataset.chartCursorRatio; delete host.dataset.chartCursorPeriod;
    };
    if (host.dataset.chartCursorPeriod === period && host.dataset.chartCursorRatio !== undefined) show(Number(host.dataset.chartCursorRatio));
    else { delete host.dataset.chartCursorRatio; delete host.dataset.chartCursorPeriod; }
}
