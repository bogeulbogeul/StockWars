import { shopFlowerMark } from '../store/ShopFlowerMark.js';
import { footprint, isOrderComplete } from './PackingLogic.js';
const ATLAS_URL = new URL('../../../assets/items/packing-v1/items.png', import.meta.url).href;
import { POPORI_BREAD_URL as BREAD_URL } from '../../data/packingArtworkAssets.js';
// Display windows into the original atlas; source pixels remain untouched.
const ART_REGIONS = [[20, 40, 390, 350], [440, 40, 350, 350], [920, 35, 155, 355],
    [1180, 130, 450, 255], [1665, 25, 275, 370], [10, 490, 410, 235],
    [450, 405, 300, 355], [840, 405, 300, 355], [1210, 430, 340, 330], [1580, 470, 410, 255]];

// Artwork stays upright; only the puzzle footprint uses the prepared orientation.
export function artHtml(item) {
    if (item.id === 'D') {
        return `<svg class="packing-art" aria-hidden="true" viewBox="0 0 250 100">
                <image href="${BREAD_URL}" width="250" height="100"/></svg>`;
    }
    const [x, y, w, h] = ART_REGIONS[item.art];
    return `<svg class="packing-art" aria-hidden="true" viewBox="0 0 ${w} ${h}">
        <svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden">
            <image href="${ATLAS_URL}" width="2000" height="800"/></svg></svg>`;
}

export function shellHtml() {
    return `<div class="packing-shell">
        <header class="packing-header">
            <div class="packing-brand"><span class="packing-flower" aria-hidden="true">${shopFlowerMark}</span>
                <div><h1 id="packing-title">잡화점 포장 알바</h1><p>물건을 끌어 상자에 쏙 담아주세요</p></div></div>
            <div class="packing-progress" aria-label="포장 진행"><strong></strong><div class="packing-stamps" aria-hidden="true"></div></div>
            <button type="button" data-action="close" class="packing-close" aria-label="포장 알바 나가기" title="나갔다 돌아오면 이어서 할 수 있어요">✕</button>
        </header>
        <main class="packing-workbench">
            <section class="packing-box-area" aria-label="포장 상자">
                <h2 class="packing-box-title"></h2>
                <div class="packing-box"><div class="packing-grid" aria-label="상품을 놓을 칸"></div>
                    <div class="packing-placed"></div><div class="packing-preview" hidden></div></div>
                <p class="packing-box-note">빈칸 없이 딱 맞게! 모든 물건을 담아주세요.</p>
            </section>
            <section class="packing-tray" aria-labelledby="packing-tray-title"><h2 id="packing-tray-title">담을 물건</h2>
                <p class="packing-remaining"></p><div class="packing-tray-items"></div>
            </section>
        </main>
        <footer class="packing-footer"><p class="packing-instruction">끌어서 담기 · 선택 후 칸 누르기도 가능</p>
            <div class="packing-controls">
                <button type="button" data-action="reset">모두 꺼내기</button>
                <button type="button" data-action="finish" class="packing-primary">포장 완료</button></div>
            <p class="packing-message" role="status" aria-live="polite"></p></footer>
        <section class="packing-result" hidden aria-labelledby="packing-result-title"></section>
        <div class="packing-ghost" hidden></div>
    </div>`;
}

export function renderPacking(dialog, session, selected) {
    const order = session.orders[Math.min(session.completed, session.orders.length - 1)];
    dialog.querySelector('.packing-progress strong').textContent = `포장 완료 ${session.completed} / ${session.orders.length}`;
    dialog.querySelector('.packing-stamps').innerHTML = session.orders.map((_, i) =>
        `<span class="${i < session.completed ? 'done' : ''}">${i < session.completed ? '✓' : '◇'}</span>`).join('');
    dialog.querySelector('.packing-box-title').textContent = `이번 상자 ${order.width} × ${order.height}`;
    const box = dialog.querySelector('.packing-box');
    box.style.setProperty('--cols', order.width);
    box.style.setProperty('--rows', order.height);
    const grid = dialog.querySelector('.packing-grid');
    grid.innerHTML = Array.from({ length: order.width * order.height }, (_, i) =>
        `<button type="button" class="packing-cell" data-x="${i % order.width}" data-y="${Math.floor(i / order.width)}"
            aria-label="${Math.floor(i / order.width) + 1}행 ${i % order.width + 1}열에 놓기"></button>`).join('');
    dialog.querySelector('.packing-placed').innerHTML = order.items.filter(item => item.x !== null).map(item => {
        const size = footprint(item);
        return `<button type="button" data-item="${item.id}" class="packing-piece ${item.id === selected ? 'selected' : ''}"
            style="left:${item.x / order.width * 100}%;top:${item.y / order.height * 100}%;width:${size.width / order.width * 100}%;height:${size.height / order.height * 100}%"
            aria-label="${item.name}, ${size.width} 곱하기 ${size.height}, ${item.y + 1}행 ${item.x + 1}열" aria-pressed="${item.id === selected}">
            ${artHtml(item)}<span class="packing-piece-label">${item.name}</span></button>`;
    }).join('');
    const remaining = order.items.filter(item => item.x === null);
    dialog.querySelector('.packing-remaining').textContent = remaining.length ? `${remaining.length}개 남았어요` : '모두 담았어요!';
    const groups = new Map();
    for (const item of remaining) {
        const key = `${item.art}:${item.rotated}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }
    dialog.querySelector('.packing-tray-items').innerHTML = [...groups.values()].map(items => {
        const item = items.find(item => item.id === selected) || items[0];
        const size = footprint(item);
        return `<button type="button" class="packing-item-card ${selected === item.id ? 'selected' : ''}" data-item="${item.id}"
            aria-label="${item.name}, ${items.length}개, ${size.width} 곱하기 ${size.height}, 선택" aria-pressed="${selected === item.id}">
            <span class="packing-card-art">${artHtml(item)}${items.length > 1 ? `<span class="packing-quantity" aria-hidden="true">×${items.length}</span>` : ''}</span><span><strong>${item.name}</strong><small>${size.width} × ${size.height}</small></span></button>`;
    }).join('') || '<p class="packing-tray-empty">차곡차곡 잘 담았어요.<br>포장 완료를 눌러주세요.</p>';
    dialog.querySelector('[data-action="finish"]').disabled = !isOrderComplete(order) || session.awaitingNext;
    dialog.querySelector('[data-action="reset"]').disabled = !order.items.some(item => item.x !== null) || session.awaitingNext;
    dialog.querySelector('.packing-workbench').inert = session.awaitingNext;
    dialog.querySelector('.packing-footer').inert = session.awaitingNext;
    const result = dialog.querySelector('.packing-result');
    result.hidden = !session.awaitingNext;
    if (session.awaitingNext) {
        const done = session.completed === session.orders.length;
        result.innerHTML = `<div class="packing-result-card"><div class="packing-parcel" aria-hidden="true">${shopFlowerMark}</div>
            <p>${session.completed} / ${session.orders.length} 상자</p><h2 id="packing-result-title">${done ? '오늘의 포장 완료!' : '상자 하나 완성!'}</h2>
            <p>${done ? '모든 물건을 정성껏 포장했어요.' : '다음에는 어떤 물건이 기다릴까요?'}</p>
            <button type="button" class="packing-primary" data-action="${done ? 'close' : 'next'}">${done ? '나가기' : '다음 상자'}</button>
            </div>`;
    }
}
