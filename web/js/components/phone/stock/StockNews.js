import { esc } from './StockFormat.js';

export function renderStockNews(host, source, { stockId, onStock } = {}) {
    host.classList.add('stock-news');
    let signature;
    const render = () => {
        const news = source.news().filter(n => !stockId || n.stockId === stockId);
        const next = news.map(n => n.id).join('|');
        if (signature === next) return; signature = next;
        host.innerHTML = `${stockId ? '<p>선택한 종목의 공시·뉴스</p>' : ''}${news.map(n => {
            const paragraphs = Array.isArray(n.body) && n.body.length ? n.body : String(n.body || n.content || '').split(/\n\s*\n/);
            return `<article><small>${esc(n.type)} · ${esc(n.time)} · ${esc(n.source || '증시 뉴스')}</small><h3>${esc(n.title)}</h3>${paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}${n.stockId ? `<button type="button" data-news-stock="${esc(n.stockId)}">종목 보기 ›</button>` : ''}</article>`;
        }).join('') || '<p>표시할 공식 뉴스가 없습니다.</p>'}`;
    };
    render();
    const unsubscribe = source.subscribe?.(render);
    host.onclick = event => {
        const button = event.target.closest('[data-news-stock]');
        if (button) onStock?.(button.dataset.newsStock);
    };
    return () => { unsubscribe?.(); host.onclick = null; host.classList.remove('stock-news'); };
}
