import { CURRENT_NEWS } from '../../web/js/data/newsCatalog.js';
import { INITIAL_STOCKS } from '../../web/js/data/stocksData.js';
import { stockBrand, shortSectorName } from '../../web/js/components/phone/stock/StockBrand.js';
import { esc } from '../../web/js/components/phone/stock/StockFormat.js';

const featuredIds = ['CN_CLOUDBERRY_P2','CN_ECOBATTERY_P1','CN_COZYPAY_N1','CN_STUDIOLUNA_P1'];
const articles = [...featuredIds.map(id => CURRENT_NEWS.find(n => n.id === id)).filter(Boolean), ...CURRENT_NEWS.filter(n => !featuredIds.includes(n.id))];
const sectors = ['ALL','IT','Entertainment','Infrastructure','Bio','Aerospace','Retail','Energy','Finance'];
const feed = document.querySelector('#feed');
let sector = 'ALL', selected = featuredIds[0];
document.querySelector('#filters').innerHTML = sectors.map(key => `<button type="button" data-sector="${key}" aria-pressed="${key === sector}">${key === 'ALL' ? '전체' : shortSectorName(key)}</button>`).join('');
function company(article) {
    const stock = INITIAL_STOCKS.find(s => s.id === article.stockId);
    return `<div class="company">${stockBrand(stock)}<span><strong>${esc(article.companyName)}</strong><small>${esc(shortSectorName(article.sector))} · ${esc(article.stockId)}</small></span><span class="type-tag">${esc(article.type)}</span></div>`;
}
function renderList() {
    const query = document.querySelector('#search').value.trim().toLowerCase();
    const filtered = articles.filter(n => (sector === 'ALL' || n.sector === sector) && `${n.companyName} ${n.title} ${n.stockId}`.toLowerCase().includes(query));
    document.querySelector('#count').textContent = `${filtered.length}건`;
    feed.innerHTML = filtered.map(n => `<button type="button" class="news-card" data-id="${esc(n.id)}" data-sector="${n.sector}" aria-current="${n.id === selected}">${company(n)}<strong class="headline">${esc(n.title)}</strong><span class="summary">${esc(n.content)}</span><span class="card-footer"><span>${esc(n.time)}</span><b>기사 읽기 ›</b></span></button>`).join('') || '<p>검색 결과가 없습니다.</p>';
}
function renderArticle(id) {
    selected = id;
    const article = articles.find(n => n.id === id);
    document.querySelector('#reader').innerHTML = `${company(article)}<h1>${esc(article.title)}</h1><div class="byline">${esc(article.source)}<br>${esc(article.time)}</div>${article.body.map(text => `<p>${esc(text)}</p>`).join('')}`;
    document.querySelector('#reader').scrollTop = 0;
    document.querySelector('#demo-message').hidden = true;
    renderList();
}
feed.onclick = e => { const card = e.target.closest('[data-id]'); if (card) renderArticle(card.dataset.id); };
document.querySelector('#search').oninput = renderList;
document.querySelector('#filters').onclick = e => {
    const button = e.target.closest('[data-sector]'); if (!button) return;
    sector = button.dataset.sector;
    document.querySelectorAll('#filters button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderList();
};
document.querySelector('#back').onclick = () => document.querySelector('#search').focus();
document.querySelector('#stock').onclick = () => { document.querySelector('#demo-message').hidden = false; };
renderArticle(selected);
document.body.dataset.ready = 'true';
