import { esc, money, num } from './StockFormat.js';
import { newsCard } from '../news/NewsTemplates.js';
export function infoNewsScreen(stock, news = []) {
    const related = news.filter(a => a.stockId === stock.id && a.type !== '찌라시');
    return `<section class="stock-info-news"><h3>관련 뉴스</h3><div class="stock-info-news-cards">${related.map(a => newsCard(a, new Map([[stock.id, stock]]))).join('') || '<p>현재 관련 뉴스가 없습니다.</p>'}</div></section>`;
}
export function infoScreen(stock, news = []) {
    const values = [ ['PER', `${num(stock.per)}배`], ['PBR', `${num(stock.pbr)}배`], ['ROE', `${num(stock.roe)}%`],
        ['주간 배당률', `${num((stock.dividend || 0) * 100)}%`], ['시가총액', String(stock.marketCap || '—').replace(/Gold|G\b/g, '잎')],
        ['52주 최고 / 최저', `${money(stock.high52 || stock.price * 1.1)} / ${money(stock.low52 || stock.price * .9)}`],
        ['위험도 등급', stock.risk || '—'], ['변동성 티어', stock.tier || '—'] ];
    return `<h3>기업 개요</h3><p>${esc(stock.richDesc || stock.desc)}</p><h3>핵심 투자 지표</h3><div class="stock-info-grid">${values.map(([name, value]) => `<div><small>${name}</small><strong>${esc(value)}</strong></div>`).join('')}</div><details><summary>지표 설명 보기</summary><p>PER은 이익 대비 주가, PBR은 순자산 대비 주가, ROE는 자기자본 대비 이익을 나타냅니다. 표시 수치는 게임 기업의 설정값입니다.</p></details>${infoNewsScreen(stock, news)}<button type="button" data-related>전체 관련 뉴스 보기 ›</button>`;
}
