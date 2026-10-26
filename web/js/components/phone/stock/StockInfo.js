import { esc, money, num } from './StockFormat.js';
export function infoScreen(stock) {
    const values = [ ['PER', `${num(stock.per)}배`], ['PBR', `${num(stock.pbr)}배`], ['ROE', `${num(stock.roe)}%`],
        ['주간 배당률', `${num((stock.dividend || 0) * 100)}%`], ['시가총액', String(stock.marketCap || '—').replace(/Gold|G\b/g, '잎')],
        ['52주 최고 / 최저', `${money(stock.high52 || stock.price * 1.1)} / ${money(stock.low52 || stock.price * .9)}`],
        ['위험도 등급', stock.risk || '—'], ['변동성 티어', stock.tier || '—'] ];
    return `<h3>기업 개요</h3><p>${esc(stock.richDesc || stock.desc)}</p><h3>핵심 투자 지표</h3><div class="stock-info-grid">${values.map(([name, value]) => `<div><small>${name}</small><strong>${esc(value)}</strong></div>`).join('')}</div><details><summary>지표 설명 보기</summary><p>PER은 이익 대비 주가, PBR은 순자산 대비 주가, ROE는 자기자본 대비 이익을 나타냅니다. 표시 수치는 게임 기업의 설정값입니다.</p></details><button type="button" data-related>관련 공시·뉴스는 소식 앱에서 보기 ›</button>`;
}
