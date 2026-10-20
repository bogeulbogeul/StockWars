import { bindingLabel, refreshKeyHints } from '../app/GameKeys.js';
import { characterSpriteSVG } from './CharacterSprite.js';
import { TOWN_BUILDINGS } from '../data/townWorldData.js';

export const HELP_PAGES = [
    { title: '마을을 자유롭게 돌아다니기', short: '이동', text: '이동키나 방향키로 걷고, 달리기 키를 함께 눌러 빠르게 이동하세요.' },
    { title: '건물 앞에서 상호작용하기', short: '건물', text: '건물 입구에 가까이 가면 안내가 나타납니다. 상호작용 키를 누르세요. 준비 중인 건물에서는 설명을 볼 수 있어요.' },
    { title: '수량을 정하고 매수·매도하기', short: '거래', text: '매수는 주식을 사는 것, 매도는 파는 것이에요. 주문 전에 수량과 예상 금액을 확인하세요.' },
    { title: '벤치와 드링크로 기력 회복하기', short: '기력 회복', text: '벤치는 하루 1회 기력을 전부 회복하고, 드링크는 1개당 하트 1개를 회복해요. 최대 기력은 넘지 않아요.' },
    { title: '찌라시에서 단서 읽기', short: '찌라시', text: '가방의 찌라시 탭에서 정보를 선택하고 읽어 보세요. 분석력이 높을수록 구체적인 단서를 볼 수 있지만, 내용이 사실이라는 뜻은 아니에요.' },
    { title: '의뢰를 완료하고 칭호 모으기', short: '의뢰·칭호', text: '마을 인물에게 의뢰를 수락한 뒤 목표를 달성하세요. 서브 퀘스트에서 보상을 받고, 스마트폰의 칭호 도감에서 획득한 칭호를 장착할 수 있어요.' },
    { title: '하루를 넘기기 전에 월세 확인하기', short: '하루·월세', text: '현재 경제 규칙은 7일 차에 정산하니, 월세 5,000G를 현금으로 준비하세요.' }
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
        this.dialog.innerHTML = '<header class="help-header"><div><small>PLAY GUIDE</small><h2 id="helpTitle">그림으로 보는 도움말</h2></div><button type="button" class="help-close" aria-label="도움말 닫기">✕</button></header><nav class="help-tabs" aria-label="도움말 주제"></nav><section class="help-card" aria-live="polite"><h3></h3><div class="help-visual"></div><p class="help-description"></p><div class="tutorial-next-action"><small>다음 행동</small><strong class="help-next-action"></strong></div></section><footer class="help-footer"><button type="button" data-help="prev">← 이전</button><span class="help-count"></span><button type="button" data-help="next">다음 →</button></footer><p class="help-shortcuts"></p><p class="help-tip">← → 페이지 이동 · ESC 닫기 · 조작키는 설정에서 변경할 수 있어요.</p>';
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
        this.dialog.querySelector('.help-next-action').textContent = [bindingLabel('w') + '·' + bindingLabel('a') + '·' + bindingLabel('s') + '·' + bindingLabel('d') + '로 이동해 보세요.', '건물 입구에서 ' + bindingLabel('f') + '를 눌러 보세요.', '종목 선택 → 수량 확인 → 매수 또는 매도 버튼을 누르세요.', '벤치에서 쉬거나 가방에서 드링크를 사용하세요.', '가방 → 찌라시 → 정보 선택 → 읽기', '의뢰 수락 → 목표 달성 → 보상 수령 → 칭호 도감에서 장착', '월세 목표에서 남은 기간과 준비한 현금을 확인하세요.'][this.index];
        [...this.tabs.children].forEach((b,i) => { b.classList.toggle('active',i === this.index); b.setAttribute('aria-current',i === this.index ? 'page' : 'false'); });
        this.dialog.querySelector('.help-count').textContent = (this.index + 1) + ' / ' + HELP_PAGES.length;
        this.dialog.querySelector('[data-help="prev"]').disabled = this.index === 0;
        this.dialog.querySelector('[data-help="next"]').disabled = this.index === HELP_PAGES.length - 1;
        if (this.index === 0) visual.innerHTML = '<div class="help-move-scene"><div class="help-move-up">↑ ' + key('w') + '</div><div class="help-move-left">' + key('a') + ' ←</div><div class="help-avatar">' + characterSpriteSVG({ styleId: 'dog', direction: 'down' }) + '</div><div class="help-move-right">→ ' + key('d') + '</div><div class="help-move-down">↓ ' + key('s') + '</div></div><div class="help-key-caption">' + key('shift') + ' 달리기 <span>방향키로도 이동할 수 있어요</span></div>';
        if (this.index === 1) visual.innerHTML = '<div class="help-building-scene"><div class="help-facility">' + building('vivian_store') + '<strong>봉봉 잡화점</strong></div><span class="help-arrow">→</span><div class="help-interaction"><div class="help-avatar">' + characterSpriteSVG({ styleId: 'black-cat', direction: 'up' }) + '</div><div class="help-callout">' + key('f') + ' 잡화점 입장</div></div></div><div class="help-key-caption">입구에 접근 <span>→ 안내 확인 → 키 누르기</span></div>';
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
        if (this.index === 3) visual.innerHTML = `<div class="help-info-grid">
            <article class="help-info-panel"><div class="help-avatar">${characterSpriteSVG({ styleId: 'dog', direction: 'down', seated: true })}</div><h4>벤치에서 쉬기</h4><p>${key('f')} 앉기 · 하루 1회 전부 회복</p><small>이동키를 누르면 일어나요.</small></article>
            <article class="help-info-panel"><img class="help-item-picture" src="${new URL('../../assets/items/vivian-front-v1/item_energy_drink.png', import.meta.url).href}" alt="에너지 드링크"><h4>에너지 드링크</h4><p>${key('i')} 가방 → 소모품 → 사용</p><small>1개당 하트 1개 · 잡화점이나 자판기에서 구매</small></article>
        </div>`;
        if (this.index === 4) visual.innerHTML = `<div class="help-guide-character"><div class="help-avatar">${characterSpriteSVG({ styleId: 'black-cat', direction: 'down' })}</div><div><h4>이름보다 사건의 단서를 살펴보세요</h4><p>기업·사건·발표 시점을 연결하고 시세와 비교해 보세요.</p></div></div><ol class="help-flow"><li>${key('i')} 가방에서 <strong>찌라시</strong> 선택</li><li>정보를 골라 <strong>읽기</strong></li><li>단서를 비교한 뒤 거래 판단</li></ol><p class="help-info-note">분석력은 단서를 자세히 보여 줘요. 정보의 진위를 보장하지는 않아요.</p>`;
        if (this.index === 5) visual.innerHTML = `<div class="help-guide-character"><div class="help-avatar">${characterSpriteSVG({ styleId: 'dog', direction: 'down' })}</div><div><h4>수락한 의뢰부터 차근차근</h4><p>튜토리얼 이후 마을 인물의 의뢰를 받을 수 있어요.</p></div></div><ol class="help-flow"><li>마을 인물에게 의뢰 <strong>수락</strong></li><li>목표 달성 후 <strong>서브 퀘스트에서 보상 받기</strong></li><li>${key('p')} 스마트폰 → <strong>칭호 도감</strong> → 장착</li></ol><p class="help-info-note">칭호는 프로필과 이름표에 표시돼요. 바꿔도 시작 능력은 유지돼요.</p>`;
        if (this.index === 6) visual.innerHTML = `<div class="help-info-grid"><article class="help-info-panel"><h4>하루 진행</h4><strong class="help-large-value">DAY +1</strong><p>생활 일정 확인</p><small>시세 변동 · 기력 회복</small></article><article class="help-info-panel"><h4>첫 월세 목표</h4><strong class="help-large-value">5,000 G</strong><p>7일 차 정산 · 보유 현금에서 차감</p><small>퀘스트 패널의 월세 목표에서 확인</small></article></div><p class="help-info-note">주식 평가액은 월세로 바로 낼 수 없어요. 정산 전에 필요한 현금을 확보하세요.</p>`;
        this.dialog.querySelector('.help-shortcuts').innerHTML = '가방 ' + key('i') + ' · 스마트폰 ' + key('p') + ' · 프로필은 상단 프로필 버튼';
        refreshKeyHints(this.dialog);
    }
    open() {
        if (this.dialog.open) return;
        this.returnFocus = document.activeElement;
        this.showPage(0); this.dialog.showModal();
    }
}
