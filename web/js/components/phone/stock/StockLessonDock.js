import { money } from './StockFormat.js';

// Adapted from the previous ownership/price/chart/order/account tutorial.
export function stockLessonPages(context, state = {}) {
    const budget = state.firstTrade?.budget ?? 0;
    const pages = {
        home: [
            ['계좌 살펴보기', '현금은 지금 쓸 수 있는 잎, 총자산은 현금과 주식 평가금액의 합입니다.', '.stock-summary'],
            ['회사 찾기', '주식 거래에서 궁금한 회사를 골라보세요.', '[data-tab="market"]']
        ],
        market: [
            ['첫 매수 예산', `이번 예산은 ${money(budget)}입니다. 카드의 1주 가격과 매수 후 잔액을 비교하세요.`, '.stock-recommendations'],
            ['기업 정보부터', '궁금한 회사를 눌러 어떤 일을 하는지 확인하세요. 선택만으로 매수되지는 않습니다.', '.stock-recommendations']
        ],
        info: [
            ['어떤 회사인가요?', '무엇을 만들고 어떤 서비스를 제공하는 회사인지 읽어보세요.', '.stock-detail-content > h3:first-of-type'],
            ['기업 지표', 'PER·PBR·ROE는 이익·순자산·수익성을 살펴보는 지표입니다. 숫자 하나만으로 판단하지 마세요.', '.stock-info-grid']
        ],
        chart: [
            ['가격의 기록', '차트는 과거 가격의 기록입니다. 그래프를 가리키면 시각과 가격을 볼 수 있습니다.', '.stock-chart'],
            ['변화 살펴보기', '기간과 확대 버튼으로 움직임을 살펴보세요. 과거의 상승이 앞으로의 수익을 보장하지는 않습니다.', '.stock-chart-controls']
        ],
        order: [
            ['현물 1주', '오늘은 내 현금으로 1주를 삽니다. 연습은 표시 가격으로 진행하며 수수료는 없습니다.', '[data-qty]'],
            ['결제 확인', '회사·가격·결제 후 잔액을 확인하세요. 확인 완료 후 매수를 누르면 바로 체결됩니다.', '.stock-order-review']
        ],
        account: [
            ['보유 주식', '보유 수량과 평균 매입가를 확인하세요. 평가 손익은 현재 가격에 따라 달라집니다.', '.stock-holding']
        ],
        history: [
            ['거래 기록', '언제, 어떤 주식을, 몇 주에 얼마로 거래했는지 확인하세요.', '.stock-history']
        ]
    };
    return pages[context] || pages.market;
}

export class StockLessonDock {
    constructor(host, { navigate, ready } = {}) {
        Object.assign(this, { host, navigate, ready }); this.positions = new Map(); this.completed = new Set();
        this.node = document.createElement('aside'); this.node.className = 'stock-lesson-dock'; this.node.hidden = true;
        this.node.setAttribute('aria-label', '토리의 첫 주식 안내');
        this.node.innerHTML = '<div><strong>토리</strong><small>첫 주식 수업</small></div><div class="stock-lesson-copy"><small data-lesson-title></small><p aria-live="polite"></p></div><div class="stock-lesson-actions"><button type="button" data-lesson-prev>‹ 이전</button><button type="button" data-lesson-next>다음 ›</button></div>';
        host.append(this.node);
    }
    selectStock() {
        for (const key of ['info', 'chart', 'order']) { this.positions.delete(key); this.completed.delete(key); }
        this.ready?.(false);
    }
    update(active, context, state = this.state) {
        this.state = state; this.context = context;
        this.node.hidden = !active; this.host.classList.toggle('stock-app--lesson', !!active);
        this.host.querySelectorAll('.stock-lesson-target').forEach(el => el.classList.remove('stock-lesson-target'));
        if (!active) return;
        const lines = stockLessonPages(context, state), index = Math.min(this.positions.get(context) || 0, lines.length - 1);
        const [title, text, selector] = lines[index];
        this.node.querySelector('[data-lesson-title]').textContent = `${title} · ${index + 1} / ${lines.length}`;
        this.node.querySelector('p').textContent = context === 'order' && index === lines.length - 1 && this.completed.has('order') ? '확인했습니다. 매수를 누르면 현물 1주가 체결됩니다.' : text;
        this.node.querySelector('[data-lesson-prev]').disabled = index === 0;
        const next = this.node.querySelector('[data-lesson-next]'), last = index === lines.length - 1;
        next.hidden = last && (!['info','chart','order'].includes(context) || this.completed.has(context));
        next.textContent = !last ? '다음 ›' : context === 'info' ? '차트 살펴보기 ›' : context === 'chart' ? '주문 알아보기 ›' : '확인 완료';
        if (selector) this.host.querySelectorAll(selector).forEach(el => el.classList.add('stock-lesson-target'));
    }
    next() {
        const lines = stockLessonPages(this.context, this.state), index = this.positions.get(this.context) || 0;
        if (index < lines.length - 1) this.positions.set(this.context, index + 1);
        else {
            if (this.context === 'order' && !this.completed.has('info')) return this.navigate?.('info');
            if (this.context === 'order' && !this.completed.has('chart')) return this.navigate?.('chart');
            this.completed.add(this.context);
            if (this.context === 'info') return this.navigate?.('chart');
            if (this.context === 'chart') return this.navigate?.(this.completed.has('info') ? 'order' : 'info');
            if (this.context === 'order') {
                this.ready?.(true);
            }
        }
        this.update(true, this.context);
    }
    previous() { this.positions.set(this.context, Math.max(0, (this.positions.get(this.context) || 0) - 1)); this.update(true, this.context); }
    destroy() { this.host.querySelectorAll('.stock-lesson-target').forEach(el => el.classList.remove('stock-lesson-target')); this.node.remove(); this.host.classList.remove('stock-app--lesson'); }
}
