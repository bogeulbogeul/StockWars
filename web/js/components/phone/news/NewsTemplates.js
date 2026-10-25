import { esc } from '../stock/StockFormat.js';
import { stockBrand, shortSectorName } from '../stock/StockBrand.js';

export function companyHtml(article, stocks) {
    const stock = stocks.get(article.stockId);
    const sector = article.sector || stock?.sector || '';
    return `<div class="news-company">${stock ? stockBrand(stock) : ''}<span><strong>${esc(article.companyName || stock?.name || article.stockId || '기업 소식')}</strong><small>${esc(shortSectorName(sector))}${sector ? ' · ' : ''}${esc(article.stockId)}</small></span><span class="news-type">${esc(article.type || '뉴스')}</span></div>`;
}
export function newsCard(article, stocks) {
    return `<button type="button" class="news-list-card" data-news-id="${esc(article.id)}">${companyHtml(article, stocks)}<strong class="news-headline">${esc(article.title)}</strong><span class="news-summary">${esc(article.content || '')}</span><span class="news-card-footer"><span>${esc(article.time || '')}</span><b>기사 읽기 ›</b></span></button>`;
}
export function newsReader(article, stocks) {
    const paragraphs = Array.isArray(article.body) && article.body.length ? article.body : String(article.body || article.content || '').split(/\n\s*\n/);
    return `${companyHtml(article, stocks)}<h3 tabindex="-1">${esc(article.title)}</h3><div class="news-byline">${esc(article.source || '증시 뉴스')}<br>${esc(article.time || '')}</div>${paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}`;
}
export function newsShell(sectors, stockId) {
    return `<header class="news-app-header"><button type="button" data-news-back hidden>‹ 뉴스 목록</button><h2 tabindex="-1">소식</h2><span class="news-app-emblem" aria-hidden="true">▤</span></header><section class="news-list-view"><div class="news-controls"><label><span class="stock-sr">회사명 또는 제목 검색</span><input type="search" data-news-search placeholder="회사명 또는 제목 검색"></label><nav class="news-filters" aria-label="뉴스 업종 필터"><button type="button" data-news-sector="ALL" aria-pressed="true">전체</button>${sectors.map(key => `<button type="button" data-news-sector="${key}" aria-pressed="false">${esc(shortSectorName(key))}</button>`).join('')}</nav>${stockId ? '<button type="button" class="news-clear-company" data-news-clear>종목 필터 해제 · 전체 소식 보기</button>' : ''}<div class="news-list-heading"><strong>기업 소식</strong><span data-news-count></span></div></div><div class="news-feed" data-news-feed></div></section><section class="news-reading-view" hidden><article class="news-reader"></article><footer class="news-reader-footer"><button type="button" data-news-stock>관련 종목 보기 <span>›</span></button></footer></section>`;
}
