import { SECTORS } from '../../../data/stocksData.js';
import { esc, num, money, change, stockRow, sectorName, sectorColors } from './StockFormat.js';
import { shortSectorName, stockBrand, summarySprout } from './StockBrand.js';

export function homeScreen(state, recent, favorites) {
    const cost = state.initialCash || 5000;
    const selected = recent.map(id => state.stocks.find(s => s.id === id)).filter(Boolean);
    const stocks = [...selected, ...state.stocks.filter(s => !recent.includes(s.id))].slice(0, 4);
    return `<button type="button" class="stock-summary" data-tab="account">${summarySprout}<span>내 자산 총액</span><strong>${money(state.totalNetWorth)}</strong><dl><div><dt>보유 현금</dt><dd>${money(state.cash)}</dd></div><div><dt>주식 평가금</dt><dd>${money(state.portfolioValue)}</dd></div><div><dt>평가 손익</dt><dd class="stock-${state.totalProfitLoss >= 0 ? 'up' : 'down'}">${money(state.totalProfitLoss)} ${change(cost > 0 ? state.totalProfitLoss / cost * 100 : 0)}</dd></div></dl></button><h3>최근 조회한 종목</h3>${stocks.map(s => stockRow(s, favorites)).join('')}`;
}
export function marketScreen() {
    return `<label class="stock-search"><span class="stock-sr">종목명 또는 ID 검색</span><input data-search placeholder="종목명 또는 ID 검색" type="search"></label><div class="stock-filters" aria-label="업종 필터"><button type="button" data-sector="ALL" aria-pressed="true">전체</button><button type="button" data-sector="FAV" aria-pressed="false">☆ 관심</button>${Object.keys(SECTORS).map(key => `<button type="button" data-sector="${key}" aria-pressed="false">${esc(shortSectorName(key))}</button>`).join('')}</div><label class="stock-sort">정렬 <select data-sort><option value="POPULAR">인기순</option><option value="CHANGE">변동률순</option><option value="PRICE">높은 가격순</option><option value="NAME">종목명순</option></select></label><div data-stock-list></div>`;
}
export function filterStocks(state, { query, sector, sort }, favorites, recent) {
    const needle = query.toLowerCase().trim();
    const rows = state.stocks.filter(s => (!needle || `${s.name} ${s.id}`.toLowerCase().includes(needle))
        && (sector === 'ALL' || (sector === 'FAV' ? favorites.has(s.id) : s.sector === sector)));
    const volatility = s => Math.abs(s.prevPrice > 0 ? (s.price / s.prevPrice - 1) * 100 : 0);
    rows.sort((a, b) => sort === 'NAME' ? a.name.localeCompare(b.name, 'ko') : sort === 'PRICE' ? b.price - a.price
        : sort === 'CHANGE' ? volatility(b) - volatility(a)
            : ((favorites.has(b.id) ? 1000 : 0) + (recent.includes(b.id) ? 500 : 0) + volatility(b) * 100 + b.price / 10)
              - ((favorites.has(a.id) ? 1000 : 0) + (recent.includes(a.id) ? 500 : 0) + volatility(a) * 100 + a.price / 10));
    const recommendation = state.stocks.find(s => s.id === state.tutorialStockId);
    if (recommendation) return [recommendation, ...rows.filter(s => s.id !== recommendation.id)];
    return rows;
}
export function accountScreen(state) {
    const weights = new Map(); let total = 0;
    for (const p of state.portfolio) {
        const val = Math.max(0, p.currentVal); total += val;
        weights.set(p.stock.sector, (weights.get(p.stock.sector) || 0) + val);
    }
    let angle = 0;
    const slices = [...weights].map(([key, val], i) => {
        const start = angle; angle += total ? val / total * 360 : 0;
        return `${sectorColors[i % sectorColors.length]} ${start}deg ${angle}deg`;
    });
    const legend = [...weights].map(([key, val], i) => `<li><i style="background:${sectorColors[i % sectorColors.length]}"></i>${esc(sectorName(key))}<strong>${num(total ? val / total * 100 : 0)}%</strong></li>`).join('');
    return `<h3>섹터별 투자 비중</h3><div class="stock-allocation"><div class="stock-donut" role="img" aria-label="섹터별 투자 비중" style="background:${total ? `conic-gradient(${slices.join(',')})` : '#dddccf'}"><span>${weights.size}개 업종</span></div><ul>${legend || '<li>보유 종목이 없습니다.</li>'}</ul></div><h3>내 주식 포트폴리오</h3><p>종목 보유 슬롯 ${state.portfolioSlots ? `${state.portfolioSlots.used} / ${state.portfolioSlots.max}` : '—'}</p>${state.portfolio.map(p => `<button type="button" class="stock-holding" data-stock="${esc(p.id)}"><span class="stock-holding-title">${stockBrand(p.stock)}<strong>${esc(p.stock.name)}</strong></span><small>${p.isShort ? '공매도' : '현물'} · ${p.leverage || 1}x</small><dl><div><dt>보유 수량</dt><dd>${num(p.qty)}주</dd></div><div><dt>평균 매입가</dt><dd>${money(p.avgPrice)}</dd></div><div><dt>평가금액</dt><dd>${money(p.currentVal)}</dd></div><div><dt>평가 손익</dt><dd>${money(p.profitLoss)} ${change(p.profitLossPct)}</dd></div></dl></button>`).join('') || '<p>보유 중인 주식이 없습니다.</p>'}<details class="stock-history"><summary>거래 내역 · ${state.tradeHistory.length}건</summary><p>체결된 거래를 최신순으로 표시합니다.</p>${[...state.tradeHistory].reverse().map(trade => `<article><strong>${esc(({ buy: '매수', sell: '매도', short: '공매도', liquidate: '일괄 청산' })[trade.side] || trade.side)} · ${esc(trade.stockName)}</strong><p>${num(trade.quantity)}주 × ${money(trade.price)} · 수수료 ${money(trade.fee)}<br>현금 ${money(trade.cashDelta)}${trade.profit != null ? ` · 실현 손익 ${money(trade.profit)}` : ''}</p><small>${esc(trade.time ? new Date(trade.time).toLocaleString('ko-KR') : '전시 체험 기록')} · ${trade.venue === 'brokerage' ? '증권사' : '휴대폰'}</small>${(trade.fills || []).map(fill => `<p>${num(fill.quantity)}주 × ${money(fill.price)}</p>`).join('')}</article>`).join('') || '<p>거래 내역이 없습니다.</p>'}</details>`;
}
