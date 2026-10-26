import { SECTORS } from '../../../data/stocksData.js';
import { stockBrand } from './StockBrand.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const num = value => Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
export const money = value => `${num(value)}잎`;
export const pct = stock => stock.prevPrice > 0 ? (stock.price / stock.prevPrice - 1) * 100 : 0;
export const change = value => `<span class="stock-${value >= 0 ? 'up' : 'down'}">${value >= 0 ? '+' : ''}${num(value)}%</span>`;
export const sectorName = key => SECTORS[key]?.name || key;
export const sectorColors = ['#63a579', '#619ed4', '#efbe4e', '#dd8597', '#a584ce', '#60b7a6', '#e9a266', '#8fa857'];
export function stockRow(stock, favorites) {
    return `<div class="stock-row"><button type="button" class="stock-star" data-star="${esc(stock.id)}" aria-label="${esc(stock.name)} 관심 종목" aria-pressed="${favorites.has(stock.id)}">${favorites.has(stock.id) ? '★' : '☆'}</button><button type="button" class="stock-quote" data-stock="${esc(stock.id)}"><span class="stock-identity">${stockBrand(stock)}<span class="stock-company"><strong>${esc(stock.name)}</strong><small>${esc(stock.id)} · ${esc(sectorName(stock.sector))}</small></span></span><span class="stock-right"><strong>${money(stock.price)}</strong>${change(pct(stock))}</span></button></div>`;
}
export function indexHtml(state) {
    const index = state.cipherIndex;
    const growth = state.sproutIndex;
    return `<div><span>리프 종합지수</span><strong>${index ? `${esc(index.val)} pt` : '—'}</strong>${index ? change(index.diffPct) : ''}</div><div title="성장 기업 16개 · 기준 1,000pt · 기준가격 대비 수익률 동일 비중"><span>새싹 성장지수</span><strong>${growth ? `${esc(growth.val)} pt` : '—'}</strong>${growth ? change(growth.diffPct) : '<small>시세 준비 중</small>'}</div>`;
}
