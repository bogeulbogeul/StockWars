import { bindingLabel, refreshKeyHints } from '../app/GameKeys.js';
import { createGeometricAvatarSVG } from './GeometricAvatar.js';
import { TOWN_BUILDINGS } from '../data/townWorldData.js';

export const HELP_PAGES = [
    { title: '마을을 자유롭게 돌아다니기', short: '이동', text: '이동키나 방향키로 걷고, 달리기 키를 함께 눌러 빠르게 이동하세요.' },
    { title: '건물 앞에서 상호작용하기', short: '건물', text: '건물 입구에 가까이 가면 안내가 나타납니다. 상호작용 키를 누르세요. 준비 중인 건물에서는 설명을 볼 수 있어요.' },
    { title: '수량을 정하고 매수·매도하기', short: '거래', text: '스마트폰에서 종목을 선택한 뒤 주문 수량과 예상 금액을 확인하세요. 매수는 주식 구매, 매도는 보유 주식 판매입니다.' },
    { title: '벤치에서 쉬며 기력 채우기', short: '벤치 휴식', text: '마을 벤치에 가까이 가서 상호작용 키를 누르면 앉으며 기력을 모두 회복합니다. 벤치 회복은 하루 1회 사용할 수 있어요. 이동키를 누르면 일어납니다.' },
    { title: '에너지 드링크로 기력 회복하기', short: '드링크', text: '비비안 잡화점에서 에너지 드링크를 구매하거나, 가방에 보관한 드링크를 사용하세요. 하트 1개를 회복하며 최대 기력은 넘지 않습니다.' }
];
const key = action => '<kbd data-game-key="' + action + '">' + bindingLabel(action) + '</kbd>';
function building(id) {
    const b = TOWN_BUILDINGS.find(b => b.id === id), a = b.asset;
    return '<svg viewBox="' + [a.x,a.y,a.cropWidth,a.cropHeight].join(' ') + '" aria-hidden="true"><image href="' + a.src + '" width="' + a.width + '" height="' + a.height + '"/></svg>';
}
export class HelpModal {
    constructor(container) {
        this.index = 0;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'help-dialog';
        this.dialog.setAttribute('aria-labelledby', 'helpTitle');
        this.dialog.innerHTML = '<header class="help-header"><div><small>PLAY GUIDE</small><h2 id="helpTitle">그림으로 보는 도움말</h2></div><button type="button" class="help-close" aria-label="도움말 닫기">✕</button></header><nav class="help-tabs" aria-label="도움말 주제"></nav><section class="help-card" aria-live="polite"><h3></h3><div class="help-visual"></div><p class="help-description"></p></section><footer class="help-footer"><button type="button" data-help="prev">← 이전</button><span class="help-count"></span><button type="button" data-help="next">다음 →</button></footer><p class="help-tip">← → 페이지 이동 · ESC 닫기 · 조작키는 설정에서 변경할 수 있어요.</p>';
        container.append(this.dialog);
        this.tabs = this.dialog.querySelector('.help-tabs');
        HELP_PAGES.forEach((page,i) => {
            const button = document.createElement('button');
            button.type = 'button'; button.textContent = page.short;
            button.addEventListener('click', () => this.showPage(i)); this.tabs.append(button);
        });
        this.dialog.querySelector('.help-close').onclick = () => this.dialog.close();
        this.dialog.querySelector('[data-help="prev"]').onclick = () => this.showPage(this.index - 1);
        this.dialog.querySelector('[data-help="next"]').onclick = () => this.showPage(this.index + 1);
        this.dialog.addEventListener('keydown', e => {
            e.stopPropagation();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); this.showPage(this.index + (e.key === 'ArrowLeft' ? -1 : 1)); }
        });
        this.dialog.addEventListener('click', e => {
            const b = this.dialog.getBoundingClientRect();
            if (e.target === this.dialog && (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)) this.dialog.close();
        });
        this.dialog.addEventListener('close', () => this.returnFocus?.focus());
    }
    showPage(index) {
        this.index = Math.max(0, Math.min(HELP_PAGES.length - 1, index));
        const page = HELP_PAGES[this.index], visual = this.dialog.querySelector('.help-visual');
        this.dialog.querySelector('.help-card h3').textContent = page.title;
        this.dialog.querySelector('.help-description').textContent = page.text;
        [...this.tabs.children].forEach((b,i) => { b.classList.toggle('active',i === this.index); b.setAttribute('aria-current',i === this.index ? 'page' : 'false'); });
        this.dialog.querySelector('.help-count').textContent = (this.index + 1) + ' / ' + HELP_PAGES.length;
        this.dialog.querySelector('[data-help="prev"]').disabled = this.index === 0;
        this.dialog.querySelector('[data-help="next"]').disabled = this.index === HELP_PAGES.length - 1;
        if (this.index === 0) visual.innerHTML = '<div class="help-move-scene"><div class="help-move-up">↑ ' + key('w') + '</div><div class="help-move-left">' + key('a') + ' ←</div><div class="help-avatar">' + createGeometricAvatarSVG() + '</div><div class="help-move-right">→ ' + key('d') + '</div><div class="help-move-down">↓ ' + key('s') + '</div></div><div class="help-key-caption">' + key('shift') + ' 달리기 <span>방향키로도 이동할 수 있어요</span></div>';
        if (this.index === 1) visual.innerHTML = '<div class="help-building-scene"><div class="help-facility">' + building('vivian_store') + '<strong>비비안 잡화점</strong></div><span class="help-arrow">→</span><div class="help-interaction"><div class="help-avatar">' + createGeometricAvatarSVG() + '</div><div class="help-callout">' + key('f') + ' 잡화점 입장</div></div></div><div class="help-key-caption">입구에 접근 <span>→ 안내 확인 → 키 누르기</span></div>';
        if (this.index === 2) {
            visual.innerHTML = '<div class="help-trade-steps"><span>① ' + key('p') + ' 스마트폰 · 종목 선택</span><span>② 수량 확인</span><span>③ 매수 / 매도</span></div><div class="help-order-preview" aria-label="실제 주문창의 안내용 미리보기"></div><p class="help-tip">주문창 예시 · 도움말에서는 주문이 실행되지 않습니다.</p>';
            const source = document.querySelector('#tradeModal .trade-form-panel');
            if (source) {
                const clone = source.cloneNode(true);
                clone.setAttribute('inert',''); clone.setAttribute('aria-hidden','true');
                clone.querySelectorAll('[id]').forEach(el => { if (el.id === 'tradeQtyInput' || el.id === 'btnBuyExecute' || el.id === 'btnSellExecute') el.classList.add('help-highlight'); el.removeAttribute('id'); });
                clone.querySelectorAll('button,input,select').forEach(el => { el.tabIndex = -1; });
                clone.querySelectorAll('.order-type-selector,.leverage-selector').forEach(el => el.remove());
                visual.querySelector('.help-order-preview').append(clone);
            } else visual.querySelector('.help-order-preview').textContent = '종목 선택 → 주문 수량 입력 → 예상 금액 확인 → 매수 또는 매도';
        }
        if (this.index === 4) visual.innerHTML = '<div class="help-recovery-scene"><div class="help-facility">' + building('vivian_store') + '<strong>잡화점에서 구매</strong></div><span class="help-arrow">→</span><div class="help-drink"><img src="' + new URL('../../assets/items/vivian-front-v1/item_energy_drink.png', import.meta.url).href + '" alt="게임의 에너지 드링크"><strong>에너지 드링크 사용</strong></div><span class="help-arrow">→</span><div class="help-hearts"><span>♥ ♥ ♡</span><span class="help-arrow">↓</span><strong>♥ ♥ ♥</strong><small>하트 1개 회복</small></div></div><div class="help-key-caption">' + key('i') + ' 가방 열기 <span>남은 구매 횟수는 잡화점에서 확인하세요</span></div>';
        if (this.index === 3) visual.innerHTML = '<div class="help-building-scene"><div class="help-facility help-bench-picture"><svg viewBox="78 158 1382 664" aria-hidden="true"><image href="' + new URL('../../assets/props/topdown-v1/BenchSimple.png', import.meta.url).href + '" width="1536" height="1024"/></svg><strong>마을 벤치에 접근</strong></div><span class="help-arrow">→</span><div class="help-interaction"><div class="help-avatar">' + createGeometricAvatarSVG() + '</div><div class="help-callout">' + key('f') + ' 앉아서 쉬기</div></div><span class="help-arrow">→</span><div class="help-hearts"><span>♥ ♡ ♡</span><span class="help-arrow">↓</span><strong>♥ ♥ ♥</strong><small>기력 전부 회복</small></div></div><div class="help-key-caption">하루 1회 기력 완충 <span>이동키를 누르면 일어나요 · 하트는 설명용 예시입니다</span></div>';
        refreshKeyHints(this.dialog);
    }
    open() {
        if (this.dialog.open) return;
        this.returnFocus = document.activeElement;
        this.showPage(0); this.dialog.showModal();
    }
}
